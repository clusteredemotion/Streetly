import { Router } from "express";
import { db } from "@workspace/db";
import { deliveryOrdersTable, businessesTable, ridersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "./auth.js";

function getUserIdFromReq(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const payload = verifyToken(h.slice(7));
  return payload?.userId ?? null;
}

const router = Router({ mergeParams: true });
const standaloneRouter = Router();

async function enrichDelivery(order: typeof deliveryOrdersTable.$inferSelect) {
  const [business] = await db.select({
    id: businessesTable.id, name: businessesTable.name, slug: businessesTable.slug,
    address: businessesTable.address, latitude: businessesTable.latitude, longitude: businessesTable.longitude,
    phone: businessesTable.phone,
  }).from(businessesTable).where(eq(businessesTable.id, order.businessId)).limit(1);

  let rider = null;
  if (order.riderId) {
    const [r] = await db.select({
      id: ridersTable.id, fullName: ridersTable.fullName, phone: ridersTable.phone,
      vehicleType: ridersTable.vehicleType, currentLatitude: ridersTable.currentLatitude,
      currentLongitude: ridersTable.currentLongitude, lastLocationAt: ridersTable.lastLocationAt,
    }).from(ridersTable).where(eq(ridersTable.id, order.riderId)).limit(1);
    rider = r ?? null;
  }

  return { ...order, business: business ?? null, rider };
}

// POST /businesses/:businessId/deliveries — customer creates a delivery request
router.post("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return res.status(404).json({ error: "Business not found" });

  const { customerName, customerPhone, deliveryAddress, deliveryLatitude, deliveryLongitude, notes } = req.body;
  if (!customerName || !customerPhone || !deliveryAddress) {
    return res.status(400).json({ error: "customerName, customerPhone, and deliveryAddress are required" });
  }

  const userId = getUserIdFromReq(req);

  const [order] = await db.insert(deliveryOrdersTable).values({
    businessId,
    customerUserId: userId ?? null,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryLatitude: deliveryLatitude !== undefined && deliveryLatitude !== "" ? Number(deliveryLatitude) : null,
    deliveryLongitude: deliveryLongitude !== undefined && deliveryLongitude !== "" ? Number(deliveryLongitude) : null,
    notes: notes ?? null,
  }).returning();

  const enriched = await enrichDelivery(order);
  return res.status(201).json(enriched);
});

// GET /businesses/:businessId/deliveries — business owner (or admin) views their delivery orders
router.get("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return res.status(404).json({ error: "Business not found" });

  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const isOwner = business.ownerId === userId;
  const isAdmin = requester?.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  const orders = await db.select().from(deliveryOrdersTable)
    .where(eq(deliveryOrdersTable.businessId, businessId))
    .orderBy(deliveryOrdersTable.createdAt);

  const enriched = await Promise.all(orders.map(enrichDelivery));
  return res.json(enriched);
});

// GET /deliveries/:id — get order detail (for customer tracking)
standaloneRouter.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [order] = await db.select().from(deliveryOrdersTable).where(eq(deliveryOrdersTable.id, id)).limit(1);
  if (!order) return res.status(404).json({ error: "Delivery order not found" });

  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const isAdmin = requester?.role === "admin";
  const isCustomer = order.customerUserId != null && order.customerUserId === userId;

  let isAssignedRider = false;
  if (order.riderId != null) {
    const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, order.riderId)).limit(1);
    isAssignedRider = rider?.userId === userId;
  }

  let isBusinessOwner = false;
  if (!isAdmin && !isCustomer && !isAssignedRider) {
    const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, order.businessId)).limit(1);
    isBusinessOwner = business?.ownerId === userId;
  }

  if (!isAdmin && !isCustomer && !isAssignedRider && !isBusinessOwner) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const enriched = await enrichDelivery(order);
  return res.json(enriched);
});

// POST /deliveries/:id/accept — rider accepts a delivery request
standaloneRouter.post("/:id/accept", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.userId, userId)).limit(1);
  if (!rider) return res.status(403).json({ error: "No rider profile found for this user" });
  if (rider.status !== "approved") return res.status(400).json({ error: "Rider is not approved" });

  const [order] = await db.select().from(deliveryOrdersTable).where(eq(deliveryOrdersTable.id, id)).limit(1);
  if (!order) return res.status(404).json({ error: "Delivery order not found" });
  if (order.status !== "requested") return res.status(400).json({ error: "This order has already been claimed" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, order.businessId)).limit(1);
  const MAX_ACCEPT_RADIUS_KM = 25;
  if (
    business?.latitude != null && business?.longitude != null &&
    rider.currentLatitude != null && rider.currentLongitude != null
  ) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(business.latitude - rider.currentLatitude);
    const dLon = toRad(business.longitude - rider.currentLongitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(rider.currentLatitude)) * Math.cos(toRad(business.latitude)) * Math.sin(dLon / 2) ** 2;
    const distanceKm = 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
    if (distanceKm > MAX_ACCEPT_RADIUS_KM) {
      return res.status(400).json({ error: `You must be within ${MAX_ACCEPT_RADIUS_KM}km of the business to accept this delivery` });
    }
  }

  const [updated] = await db.update(deliveryOrdersTable)
    .set({ riderId: rider.id, status: "accepted", acceptedAt: new Date() })
    .where(and(eq(deliveryOrdersTable.id, id), eq(deliveryOrdersTable.status, "requested")))
    .returning();

  if (!updated) return res.status(400).json({ error: "This order has already been claimed" });

  const enriched = await enrichDelivery(updated);
  return res.json(enriched);
});

// PATCH /deliveries/:id/status — rider updates order status (picked_up / delivered / cancelled)
standaloneRouter.patch("/:id/status", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { status } = req.body;
  const allowed = ["picked_up", "delivered", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const [order] = await db.select().from(deliveryOrdersTable).where(eq(deliveryOrdersTable.id, id)).limit(1);
  if (!order) return res.status(404).json({ error: "Delivery order not found" });

  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.userId, userId)).limit(1);
  if (!rider || order.riderId !== rider.id) return res.status(403).json({ error: "Forbidden" });

  // Enforce a strict state machine: requested -> accepted -> picked_up -> delivered,
  // with cancellation only allowed before the order has been delivered.
  const VALID_TRANSITIONS: Record<string, string[]> = {
    accepted: ["picked_up", "cancelled"],
    picked_up: ["delivered", "cancelled"],
  };
  const allowedNextStatuses = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowedNextStatuses.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from "${order.status}" to "${status}"` });
  }

  const timestampField = status === "picked_up" ? "pickedUpAt" : status === "delivered" ? "deliveredAt" : "cancelledAt";
  const [updated] = await db.update(deliveryOrdersTable)
    .set({ status, [timestampField]: new Date() })
    .where(and(eq(deliveryOrdersTable.id, id), eq(deliveryOrdersTable.status, order.status)))
    .returning();

  if (!updated) return res.status(409).json({ error: "Order status changed concurrently; please retry" });

  if (status === "delivered") {
    await db.update(ridersTable)
      .set({ totalDeliveries: rider.totalDeliveries + 1 })
      .where(eq(ridersTable.id, rider.id));
  }

  const enriched = await enrichDelivery(updated);
  return res.json(enriched);
});

export default router;
export { standaloneRouter as standaloneDeliveriesRouter };

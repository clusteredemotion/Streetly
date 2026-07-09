import { Router, Request } from "express";
import { db } from "@workspace/db";
import {
  deliveryOrdersTable, businessesTable, ridersTable, usersTable,
  marketplaceItemsTable, deliveryOrderItemsTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import { verifyToken } from "./auth.js";
import { blockIfMustChangePassword } from "../lib/authHelpers";

// Simple flat-fee-plus-distance pricing for rider delivery fees.
const BASE_DELIVERY_FEE = 500;
const PER_KM_DELIVERY_FEE = 100;
const MAX_RIDER_SELECT_RADIUS_KM = 25;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function computeDeliveryFee(distanceKm: number): number {
  return Math.round(BASE_DELIVERY_FEE + PER_KM_DELIVERY_FEE * distanceKm);
}

function getUserIdFromReq(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const payload = verifyToken(h.slice(7));
  return payload?.userId ?? null;
}

// Guest orders (no logged-in customer) are tracked via a random, unguessable
// per-order token handed back once at creation time, rather than requiring
// login. The token is stored (hashed) on the order row and expires after a
// fixed window, so it can't be regenerated/derived and doesn't live forever.
const GUEST_TRACKING_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function generateGuestTrackingToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashGuestTrackingToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verifyGuestTrackingToken(
  order: { guestTrackingToken: string | null; guestTrackingTokenExpiresAt: Date | null },
  token: unknown,
): boolean {
  if (typeof token !== "string" || !token) return false;
  if (!order.guestTrackingToken || !order.guestTrackingTokenExpiresAt) return false;
  if (order.guestTrackingTokenExpiresAt.getTime() < Date.now()) return false;

  const expectedBuf = Buffer.from(order.guestTrackingToken, "hex");
  const actualBuf = Buffer.from(hashGuestTrackingToken(token), "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

type BusinessParams = { businessId: string };

const router = Router({ mergeParams: true });
const standaloneRouter = Router();
router.use(blockIfMustChangePassword);
standaloneRouter.use(blockIfMustChangePassword);

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

  const items = await db.select({
    id: deliveryOrderItemsTable.id, itemId: deliveryOrderItemsTable.itemId,
    itemName: deliveryOrderItemsTable.itemName, unitPrice: deliveryOrderItemsTable.unitPrice,
    quantity: deliveryOrderItemsTable.quantity,
  }).from(deliveryOrderItemsTable).where(eq(deliveryOrderItemsTable.deliveryOrderId, order.id));

  const { guestTrackingToken: _t, guestTrackingTokenExpiresAt: _e, ...safeOrder } = order;
  return { ...safeOrder, business: business ?? null, rider, items };
}

// POST /businesses/:businessId/deliveries — customer creates a delivery request
router.post("/", async (req: Request<BusinessParams>, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return res.status(404).json({ error: "Business not found" });

  const { customerName, customerPhone, deliveryAddress, deliveryLatitude, deliveryLongitude, notes } = req.body;
  if (!customerName || !customerPhone || !deliveryAddress) {
    return res.status(400).json({ error: "customerName, customerPhone, and deliveryAddress are required" });
  }

  const userId = getUserIdFromReq(req);

  let plainTrackingToken: string | undefined;
  let guestTrackingToken: string | null = null;
  let guestTrackingTokenExpiresAt: Date | null = null;
  if (!userId) {
    plainTrackingToken = generateGuestTrackingToken();
    guestTrackingToken = hashGuestTrackingToken(plainTrackingToken);
    guestTrackingTokenExpiresAt = new Date(Date.now() + GUEST_TRACKING_TOKEN_TTL_MS);
  }

  const [order] = await db.insert(deliveryOrdersTable).values({
    businessId,
    customerUserId: userId ?? null,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryLatitude: deliveryLatitude !== undefined && deliveryLatitude !== "" ? Number(deliveryLatitude) : null,
    deliveryLongitude: deliveryLongitude !== undefined && deliveryLongitude !== "" ? Number(deliveryLongitude) : null,
    notes: notes ?? null,
    guestTrackingToken,
    guestTrackingTokenExpiresAt,
  }).returning();

  const enriched = await enrichDelivery(order);
  return res.status(201).json({ ...enriched, trackingToken: plainTrackingToken });
});

// GET /businesses/:businessId/deliveries — business owner (or admin) views their delivery orders
router.get("/", async (req: Request<BusinessParams>, res) => {
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

  const [order] = await db.select().from(deliveryOrdersTable).where(eq(deliveryOrdersTable.id, id)).limit(1);
  if (!order) return res.status(404).json({ error: "Delivery order not found" });

  // Guest (unauthenticated) orders are tracked via a per-order signed token
  // returned once at creation time, instead of requiring the customer to log in.
  if (order.customerUserId == null) {
    if (verifyGuestTrackingToken(order, req.query.token)) {
      const enriched = await enrichDelivery(order);
      return res.json(enriched);
    }
  }

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

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

// Business-scoped marketplace checkout endpoints, mounted at /businesses/:businessId.
const businessMarketRouter = Router({ mergeParams: true });

// GET /businesses/:businessId/available-riders — online, approved riders near the business,
// each with a computed delivery fee, so the customer can pick one at checkout.
businessMarketRouter.get("/available-riders", async (req: Request<BusinessParams>, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return res.status(404).json({ error: "Business not found" });
  if (business.latitude == null || business.longitude == null) {
    return res.json([]);
  }

  const onlineRiders = await db.select().from(ridersTable)
    .where(and(eq(ridersTable.status, "approved"), eq(ridersTable.isOnline, true)));

  const withDistance = onlineRiders
    .filter((r) => r.currentLatitude != null && r.currentLongitude != null)
    .map((r) => {
      const distanceKm = haversineKm(business.latitude!, business.longitude!, r.currentLatitude!, r.currentLongitude!);
      return {
        id: r.id, fullName: r.fullName, vehicleType: r.vehicleType,
        currentLatitude: r.currentLatitude, currentLongitude: r.currentLongitude,
        distanceKm, deliveryFee: computeDeliveryFee(distanceKm),
      };
    })
    .filter((r) => r.distanceKm <= MAX_RIDER_SELECT_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return res.json(withDistance);
});

// POST /businesses/:businessId/marketplace-orders — customer checks out a cart:
// picks items + a specific rider, server recomputes all pricing and creates the order pre-assigned to that rider.
businessMarketRouter.post("/marketplace-orders", async (req: Request<BusinessParams>, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return res.status(404).json({ error: "Business not found" });

  const { items, riderId, customerName, customerPhone, deliveryAddress, deliveryLatitude, deliveryLongitude, notes } = req.body;
  if (!customerName || !customerPhone || !deliveryAddress) {
    return res.status(400).json({ error: "customerName, customerPhone, and deliveryAddress are required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "At least one item is required" });
  }
  const riderIdNum = parseInt(riderId);
  if (isNaN(riderIdNum)) return res.status(400).json({ error: "riderId is required" });

  // Re-fetch item prices server-side — never trust client-supplied prices.
  const itemIds = items.map((it: { itemId: number }) => Number(it.itemId)).filter((n: number) => !isNaN(n));
  const dbItems = itemIds.length
    ? await db.select().from(marketplaceItemsTable)
        .where(and(eq(marketplaceItemsTable.businessId, businessId), inArray(marketplaceItemsTable.id, itemIds)))
    : [];
  const dbItemsById = new Map(dbItems.map((it) => [it.id, it]));

  const orderLines: { itemId: number; itemName: string; unitPrice: number; quantity: number }[] = [];
  let itemsSubtotal = 0;
  for (const raw of items) {
    const itemId = Number(raw.itemId);
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Each item must have a positive integer quantity" });
    }
    const dbItem = dbItemsById.get(itemId);
    if (!dbItem || !dbItem.isAvailable) {
      return res.status(400).json({ error: `Item ${itemId} is not available` });
    }
    orderLines.push({ itemId: dbItem.id, itemName: dbItem.name, unitPrice: dbItem.price, quantity });
    itemsSubtotal += dbItem.price * quantity;
  }

  // Validate the chosen rider is online/approved and within range, and recompute their fee.
  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, riderIdNum)).limit(1);
  if (!rider || rider.status !== "approved" || !rider.isOnline) {
    return res.status(400).json({ error: "Selected rider is not currently available" });
  }
  if (business.latitude == null || business.longitude == null || rider.currentLatitude == null || rider.currentLongitude == null) {
    return res.status(400).json({ error: "Selected rider is not currently available" });
  }
  const distanceKm = haversineKm(business.latitude, business.longitude, rider.currentLatitude, rider.currentLongitude);
  if (distanceKm > MAX_RIDER_SELECT_RADIUS_KM) {
    return res.status(400).json({ error: "Selected rider is no longer within range" });
  }
  const deliveryFee = computeDeliveryFee(distanceKm);
  const totalAmount = itemsSubtotal + deliveryFee;

  const userId = getUserIdFromReq(req);
  let plainTrackingToken: string | undefined;
  let guestTrackingToken: string | null = null;
  let guestTrackingTokenExpiresAt: Date | null = null;
  if (!userId) {
    plainTrackingToken = generateGuestTrackingToken();
    guestTrackingToken = hashGuestTrackingToken(plainTrackingToken);
    guestTrackingTokenExpiresAt = new Date(Date.now() + GUEST_TRACKING_TOKEN_TTL_MS);
  }

  const [order] = await db.insert(deliveryOrdersTable).values({
    businessId,
    customerUserId: userId ?? null,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryLatitude: deliveryLatitude !== undefined && deliveryLatitude !== "" ? Number(deliveryLatitude) : null,
    deliveryLongitude: deliveryLongitude !== undefined && deliveryLongitude !== "" ? Number(deliveryLongitude) : null,
    notes: notes ?? null,
    status: "accepted",
    riderId: rider.id,
    acceptedAt: new Date(),
    itemsSubtotal,
    deliveryFee,
    totalAmount,
    guestTrackingToken,
    guestTrackingTokenExpiresAt,
  }).returning();

  if (orderLines.length) {
    await db.insert(deliveryOrderItemsTable).values(
      orderLines.map((line) => ({
        deliveryOrderId: order.id,
        itemId: line.itemId,
        itemName: line.itemName,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      })),
    );
  }

  const enriched = await enrichDelivery(order);
  return res.status(201).json({ ...enriched, trackingToken: plainTrackingToken });
});

export default router;
export { standaloneRouter as standaloneDeliveriesRouter, businessMarketRouter };

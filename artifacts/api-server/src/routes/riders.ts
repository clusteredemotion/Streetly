import { Router } from "express";
import { db } from "@workspace/db";
import { ridersTable, usersTable, deliveryOrdersTable } from "@workspace/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { verifyToken } from "./auth.js";

function getUserIdFromReq(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const payload = verifyToken(h.slice(7));
  return payload?.userId ?? null;
}

const router = Router();

async function enrichRider(rider: typeof ridersTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, rider.userId)).limit(1);
  return {
    ...rider,
    userName: user?.name ?? "Unknown",
    userEmail: user?.email ?? "",
  };
}

// GET /riders/by-user — get rider profile for the currently logged-in user
router.get("/by-user", async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.userId, userId)).limit(1);
  if (!rider) return res.status(404).json({ error: "No rider profile found" });
  const enriched = await enrichRider(rider);
  return res.json(enriched);
});

// POST /riders/apply
router.post("/apply", async (req, res) => {
  const { fullName, phone, vehicleType, idType, idNumber } = req.body;
  if (!fullName || !phone || !vehicleType) {
    return res.status(400).json({ error: "Full name, phone, and vehicle type are required" });
  }

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "You must be logged in to apply" });

  const existing = await db.select().from(ridersTable).where(eq(ridersTable.userId, userId)).limit(1);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Already applied as a rider" });
  }

  const [rider] = await db.insert(ridersTable).values({
    userId,
    fullName,
    phone,
    vehicleType,
    idType: idType ?? null,
    idNumber: idNumber ?? null,
  }).returning();

  await db.update(usersTable).set({ role: "delivery_rider" }).where(eq(usersTable.id, userId));

  const enriched = await enrichRider(rider);
  return res.status(201).json(enriched);
});

// PATCH /riders/:riderId/status — go online/offline
router.patch("/:riderId/status", async (req, res) => {
  const riderId = parseInt(req.params.riderId);
  if (isNaN(riderId)) return res.status(400).json({ error: "Invalid riderId" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { isOnline } = req.body;
  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, riderId)).limit(1);
  if (!rider) return res.status(404).json({ error: "Rider not found" });
  if (rider.userId !== userId) return res.status(403).json({ error: "Forbidden" });
  if (rider.status !== "approved") return res.status(400).json({ error: "Rider is not approved yet" });

  const [updated] = await db.update(ridersTable)
    .set({ isOnline: Boolean(isOnline) })
    .where(eq(ridersTable.id, riderId))
    .returning();

  return res.json(updated);
});

// POST /riders/:riderId/location — push GPS location update
router.post("/:riderId/location", async (req, res) => {
  const riderId = parseInt(req.params.riderId);
  if (isNaN(riderId)) return res.status(400).json({ error: "Invalid riderId" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "latitude and longitude are required" });
  }

  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, riderId)).limit(1);
  if (!rider) return res.status(404).json({ error: "Rider not found" });
  if (rider.userId !== userId) return res.status(403).json({ error: "Forbidden" });

  const [updated] = await db.update(ridersTable)
    .set({
      currentLatitude: Number(latitude),
      currentLongitude: Number(longitude),
      lastLocationAt: new Date(),
    })
    .where(eq(ridersTable.id, riderId))
    .returning();

  return res.json(updated);
});

// GET /riders/nearby?lat=&lon=&radiusKm= — online approved riders near a point
router.get("/nearby", async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10;
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: "lat and lon are required" });

  const rows = await db
    .select({
      id: ridersTable.id,
      fullName: ridersTable.fullName,
      vehicleType: ridersTable.vehicleType,
      currentLatitude: ridersTable.currentLatitude,
      currentLongitude: ridersTable.currentLongitude,
      lastLocationAt: ridersTable.lastLocationAt,
      distanceKm: sql<number>`
        6371 * acos(
          cos(radians(${lat})) * cos(radians(${ridersTable.currentLatitude})) *
          cos(radians(${ridersTable.currentLongitude}) - radians(${lon})) +
          sin(radians(${lat})) * sin(radians(${ridersTable.currentLatitude}))
        )
      `,
    })
    .from(ridersTable)
    .where(and(
      eq(ridersTable.status, "approved"),
      eq(ridersTable.isOnline, true),
      sql`${ridersTable.currentLatitude} IS NOT NULL AND ${ridersTable.currentLongitude} IS NOT NULL`,
    ));

  const nearby = rows.filter(r => r.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
  return res.json(nearby);
});

// GET /riders/:riderId/orders — rider's order queue: their active order + nearby pending requests
router.get("/:riderId/orders", async (req, res) => {
  const riderId = parseInt(req.params.riderId);
  if (isNaN(riderId)) return res.status(400).json({ error: "Invalid riderId" });

  const active = await db.select().from(deliveryOrdersTable)
    .where(and(eq(deliveryOrdersTable.riderId, riderId), sql`${deliveryOrdersTable.status} NOT IN ('delivered', 'cancelled')`))
    .orderBy(desc(deliveryOrdersTable.createdAt));

  const available = await db.select().from(deliveryOrdersTable)
    .where(eq(deliveryOrdersTable.status, "requested"))
    .orderBy(desc(deliveryOrdersTable.createdAt))
    .limit(20);

  const [completedCountRow] = await db.select({ count: count() }).from(deliveryOrdersTable)
    .where(and(eq(deliveryOrdersTable.riderId, riderId), eq(deliveryOrdersTable.status, "delivered")));

  return res.json({ active, available, completedCount: Number(completedCountRow.count) });
});

export default router;

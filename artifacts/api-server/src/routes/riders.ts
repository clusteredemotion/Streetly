import { Router } from "express";
import { db } from "@workspace/db";
import { ridersTable, usersTable, deliveryOrdersTable, businessesTable } from "@workspace/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { verifyToken } from "./auth.js";
import { blockIfMustChangePassword } from "../lib/authHelpers";

function getUserIdFromReq(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const payload = verifyToken(h.slice(7));
  return payload?.userId ?? null;
}

const router = Router();
router.use(blockIfMustChangePassword);

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
  const { fullName, phone, vehicleType, idType, idNumber, dateOfBirth, address, passportObjectPath, ninSlipObjectPath } = req.body;
  if (!fullName || !phone || !vehicleType || !dateOfBirth || !address || !passportObjectPath || !ninSlipObjectPath) {
    return res.status(400).json({ error: "Full name, phone, vehicle type, date of birth, address, passport upload, and NIN slip upload are required" });
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
    dateOfBirth,
    address,
    passportObjectPath,
    ninSlipObjectPath,
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

// GET /riders/available — all currently online/approved riders, for the public rider directory
router.get("/available", async (req, res) => {
  const lat = req.query.lat !== undefined ? parseFloat(req.query.lat as string) : null;
  const lon = req.query.lon !== undefined ? parseFloat(req.query.lon as string) : null;
  const hasOrigin = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

  const rows = await db
    .select({
      id: ridersTable.id,
      fullName: ridersTable.fullName,
      phone: ridersTable.phone,
      vehicleType: ridersTable.vehicleType,
      currentLatitude: ridersTable.currentLatitude,
      currentLongitude: ridersTable.currentLongitude,
      lastLocationAt: ridersTable.lastLocationAt,
      totalDeliveries: ridersTable.totalDeliveries,
      createdAt: ridersTable.createdAt,
      distanceKm: hasOrigin
        ? sql<number | null>`
            CASE WHEN ${ridersTable.currentLatitude} IS NULL OR ${ridersTable.currentLongitude} IS NULL THEN NULL ELSE
              6371 * acos(
                least(1, greatest(-1,
                  cos(radians(${lat})) * cos(radians(${ridersTable.currentLatitude})) *
                  cos(radians(${ridersTable.currentLongitude}) - radians(${lon})) +
                  sin(radians(${lat})) * sin(radians(${ridersTable.currentLatitude}))
                ))
              )
            END
          `
        : sql<number | null>`NULL`,
    })
    .from(ridersTable)
    .where(and(
      eq(ridersTable.status, "approved"),
      eq(ridersTable.isOnline, true),
    ));

  const sorted = [...rows].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return res.json(sorted);
});

// GET /riders/:riderId/orders — rider's order queue: their active order + nearby pending requests
router.get("/:riderId/orders", async (req, res) => {
  const riderId = parseInt(req.params.riderId);
  if (isNaN(riderId)) return res.status(400).json({ error: "Invalid riderId" });

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, riderId)).limit(1);
  if (!rider) return res.status(404).json({ error: "Rider not found" });

  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (rider.userId !== userId && requester?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const activeRows = await db.select({
    order: deliveryOrdersTable,
    businessName: businessesTable.name,
    pickupLat: businessesTable.latitude,
    pickupLon: businessesTable.longitude,
  })
    .from(deliveryOrdersTable)
    .leftJoin(businessesTable, eq(deliveryOrdersTable.businessId, businessesTable.id))
    .where(and(eq(deliveryOrdersTable.riderId, riderId), sql`${deliveryOrdersTable.status} NOT IN ('delivered', 'cancelled')`))
    .orderBy(desc(deliveryOrdersTable.createdAt));
  const active = activeRows.map((r) => ({ ...r.order, businessName: r.businessName, pickupLat: r.pickupLat, pickupLon: r.pickupLon }));

  type EnrichedOrder = typeof deliveryOrdersTable.$inferSelect & {
    businessName: string | null; pickupLat: number | null; pickupLon: number | null;
  };
  let available: EnrichedOrder[] = [];
  if (rider.currentLatitude != null && rider.currentLongitude != null) {
    const nearbyRequested = await db.select({
      order: deliveryOrdersTable,
      businessName: businessesTable.name,
      pickupLat: businessesTable.latitude,
      pickupLon: businessesTable.longitude,
      distanceKm: sql<number>`
        6371 * acos(
          least(1, greatest(-1,
            cos(radians(${rider.currentLatitude})) * cos(radians(${businessesTable.latitude})) *
            cos(radians(${businessesTable.longitude}) - radians(${rider.currentLongitude})) +
            sin(radians(${rider.currentLatitude})) * sin(radians(${businessesTable.latitude}))
          ))
        )
      `,
    })
      .from(deliveryOrdersTable)
      .innerJoin(businessesTable, eq(deliveryOrdersTable.businessId, businessesTable.id))
      .where(and(
        eq(deliveryOrdersTable.status, "requested"),
        sql`${businessesTable.latitude} IS NOT NULL AND ${businessesTable.longitude} IS NOT NULL`,
      ))
      .orderBy(desc(deliveryOrdersTable.createdAt))
      .limit(50);

    available = nearbyRequested
      .filter((r) => r.distanceKm <= 25)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20)
      .map((r) => ({ ...r.order, businessName: r.businessName, pickupLat: r.pickupLat, pickupLon: r.pickupLon }));
  } else {
    // Rider has no known location yet — fall back to showing recent requests unranked.
    const fallbackRows = await db.select({
      order: deliveryOrdersTable,
      businessName: businessesTable.name,
      pickupLat: businessesTable.latitude,
      pickupLon: businessesTable.longitude,
    })
      .from(deliveryOrdersTable)
      .leftJoin(businessesTable, eq(deliveryOrdersTable.businessId, businessesTable.id))
      .where(eq(deliveryOrdersTable.status, "requested"))
      .orderBy(desc(deliveryOrdersTable.createdAt))
      .limit(20);
    available = fallbackRows.map((r) => ({ ...r.order, businessName: r.businessName, pickupLat: r.pickupLat, pickupLon: r.pickupLon }));
  }

  const [completedCountRow] = await db.select({ count: count() }).from(deliveryOrdersTable)
    .where(and(eq(deliveryOrdersTable.riderId, riderId), eq(deliveryOrdersTable.status, "delivered")));

  return res.json({ active, available, completedCount: Number(completedCountRow.count) });
});

export default router;

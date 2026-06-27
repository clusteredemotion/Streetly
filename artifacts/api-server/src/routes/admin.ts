import { Router } from "express";
import { db } from "@workspace/db";
import {
  businessesTable, agentsTable, usersTable, withdrawalsTable,
  businessClaimsTable, businessPhotosTable, categoriesTable,
  citiesTable, areasTable, streetsTable,
} from "@workspace/db";
import { eq, count, sql, ilike, and } from "drizzle-orm";

const router = Router();

// GET /admin/stats
router.get("/stats", async (_req, res) => {
  const [bizTotal] = await db.select({ count: count() }).from(businessesTable);
  const [agentTotal] = await db.select({ count: count() }).from(agentsTable);
  const [userTotal] = await db.select({ count: count() }).from(usersTable);
  const [pendingBiz] = await db.select({ count: count() }).from(businessesTable).where(eq(businessesTable.status, "pending"));
  const [pendingAgents] = await db.select({ count: count() }).from(agentsTable).where(eq(agentsTable.status, "pending"));
  const [revenue] = await db.select({ total: sql<number>`sum(amount)` }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "completed"));

  return res.json({
    totalBusinesses: Number(bizTotal.count),
    totalAgents: Number(agentTotal.count),
    totalUsers: Number(userTotal.count),
    pendingBusinesses: Number(pendingBiz.count),
    pendingAgents: Number(pendingAgents.count),
    revenue: Number(revenue.total ?? 0),
  });
});

// GET /admin/businesses/pending
router.get("/businesses/pending", async (_req, res) => {
  const businesses = await db.select().from(businessesTable).where(eq(businessesTable.status, "pending"));
  return res.json(businesses);
});

// PATCH /admin/businesses/:id/approve
router.patch("/businesses/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { approved } = req.body;
  const status = approved ? "approved" : "rejected";
  const verified = approved ? true : false;

  const [biz] = await db.update(businessesTable)
    .set({ status, verified })
    .where(eq(businessesTable.id, id))
    .returning();

  if (!biz) return res.status(404).json({ error: "Business not found" });

  // Credit agent if approved and has agentId
  if (approved && biz.agentId) {
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, biz.agentId)).limit(1);
    if (agent) {
      const commission = 100; // ₦100 base commission
      await db.update(agentsTable).set({
        totalEarnings: agent.totalEarnings + commission,
        availableBalance: agent.availableBalance + commission,
      }).where(eq(agentsTable.id, agent.id));
    }
  }

  return res.json(biz);
});

// GET /admin/agents/pending
router.get("/agents/pending", async (_req, res) => {
  const agents = await db.select().from(agentsTable).where(eq(agentsTable.status, "pending"));
  return res.json(agents);
});

// PATCH /admin/agents/:id/approve
router.patch("/agents/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { approved } = req.body;
  const status = approved ? "approved" : "rejected";

  const [agent] = await db.update(agentsTable)
    .set({ status })
    .where(eq(agentsTable.id, id))
    .returning();

  if (!agent) return res.status(404).json({ error: "Agent not found" });
  return res.json(agent);
});

// GET /admin/categories (for dropdowns)
router.get("/categories", async (_req, res) => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  return res.json(cats);
});

// POST /admin/businesses — admin creates a fully-specified business
router.post("/businesses", async (req, res) => {
  const {
    name, description, categoryId,
    stateName, cityName, areaName, streetName,
    address, phone, whatsapp, website, registrationNumber,
    latitude, longitude, openingHours,
    photos = [],
    verified = false,
    featured = false,
    publish = false,
  } = req.body;

  if (!name || !categoryId || !cityName || !areaName || !streetName) {
    return res.status(400).json({ error: "name, categoryId, cityName, areaName, streetName are required" });
  }

  // Find or create city
  let cityRows = await db.select().from(citiesTable)
    .where(and(ilike(citiesTable.name, cityName), ilike(citiesTable.state, stateName || "%")))
    .limit(1);
  let city = cityRows[0];
  if (!city) {
    const inserted = await db.insert(citiesTable).values({
      name: cityName, state: stateName || "Unknown", country: "Nigeria",
    }).returning();
    city = inserted[0];
  }

  // Find or create area
  let areaRows = await db.select().from(areasTable)
    .where(and(ilike(areasTable.name, areaName), eq(areasTable.cityId, city.id)))
    .limit(1);
  let area = areaRows[0];
  if (!area) {
    const inserted = await db.insert(areasTable).values({ name: areaName, cityId: city.id }).returning();
    area = inserted[0];
  }

  // Find or create street
  let streetRows = await db.select().from(streetsTable)
    .where(and(ilike(streetsTable.name, streetName), eq(streetsTable.areaId, area.id)))
    .limit(1);
  let street = streetRows[0];
  if (!street) {
    const inserted = await db.insert(streetsTable).values({ name: streetName, areaId: area.id }).returning();
    street = inserted[0];
  }

  // Build description with optional registration number
  const fullDescription = [
    description || "",
    registrationNumber ? `Registration No: ${registrationNumber}` : "",
  ].filter(Boolean).join("\n\n") || undefined;

  // Create business
  const bizInsert = await db.insert(businessesTable).values({
    name,
    description: fullDescription,
    categoryId: Number(categoryId),
    streetId: street.id,
    address,
    phone,
    whatsapp,
    website,
    latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
    longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
    openingHours,
    status: publish ? "approved" : "pending",
    verified: Boolean(verified),
    featured: Boolean(featured),
  }).returning();
  const biz = bizInsert[0];

  // Save photos (stored as data URLs or external URLs)
  if (Array.isArray(photos) && photos.length > 0) {
    await db.insert(businessPhotosTable).values(
      photos.slice(0, 10).map((p: { url: string; caption?: string }) => ({
        businessId: biz.id,
        url: p.url,
        caption: p.caption ?? null,
      }))
    );
  }

  return res.status(201).json({ ...biz, streetName: street.name, areaName: area.name, cityName: city.name });
});

// GET /admin/claims/pending
router.get("/claims/pending", async (_req, res) => {
  const claims = await db.select().from(businessClaimsTable).where(eq(businessClaimsTable.status, "pending"));
  const enriched = await Promise.all(claims.map(async (c) => {
    const [biz] = await db.select({ name: businessesTable.name }).from(businessesTable).where(eq(businessesTable.id, c.businessId)).limit(1);
    return { ...c, businessName: biz?.name ?? null };
  }));
  return res.json(enriched);
});

// PATCH /admin/claims/:id/approve
router.patch("/claims/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { approved, adminNote } = req.body;

  const [claim] = await db.update(businessClaimsTable)
    .set({ status: approved ? "approved" : "rejected", adminNote, resolvedAt: new Date() })
    .where(eq(businessClaimsTable.id, id))
    .returning();

  if (!claim) return res.status(404).json({ error: "Claim not found" });

  if (approved) {
    await db.update(businessesTable)
      .set({ ownerId: claim.userId, verified: true })
      .where(eq(businessesTable.id, claim.businessId));
  }

  return res.json(claim);
});

export default router;

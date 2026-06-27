import { Router } from "express";
import { db } from "@workspace/db";
import {
  agentsTable, usersTable, withdrawalsTable, businessesTable,
  businessPhotosTable, categoriesTable, citiesTable, areasTable, streetsTable,
} from "@workspace/db";
import { eq, desc, count, and, ilike } from "drizzle-orm";
import { verifyToken } from "./auth.js";

function getUserIdFromReq(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const payload = verifyToken(h.slice(7));
  return payload?.userId ?? null;
}

const router = Router();

async function enrichAgent(agent: typeof agentsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, agent.userId)).limit(1);
  const [listingsRow] = await db.select({ count: count() }).from(businessesTable).where(eq(businessesTable.agentId, agent.id));
  const [approvedRow] = await db.select({ count: count() }).from(businessesTable)
    .where(and(eq(businessesTable.agentId, agent.id), eq(businessesTable.status, "approved")));

  return {
    ...agent,
    userName: user?.name ?? "Unknown",
    userEmail: user?.email ?? "",
    totalListings: Number(listingsRow.count),
    approvedListings: Number(approvedRow.count),
  };
}

// GET /agents/by-user — get agent profile for the currently logged-in user
router.get("/by-user", async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId)).limit(1);
  if (!agent) return res.status(404).json({ error: "No agent profile found" });
  const enriched = await enrichAgent(agent);
  return res.json(enriched);
});

// POST /agents/apply
router.post("/apply", async (req, res) => {
  const {
    bankName, accountNumber, accountName, idType, idNumber,
    fullName, age, address, latitude, longitude,
    passportPhotoUrl, ninSlipUrl,
  } = req.body;

  if (!bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: "Bank details are required" });
  }

  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "You must be logged in to apply" });

  const existing = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId)).limit(1);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Already applied as agent" });
  }

  const [agent] = await db.insert(agentsTable).values({
    userId,
    bankName,
    accountNumber,
    accountName,
    idType,
    idNumber,
    fullName: fullName ?? null,
    age: age ? Number(age) : null,
    address: address ?? null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    passportPhotoUrl: passportPhotoUrl ?? null,
    ninSlipUrl: ninSlipUrl ?? null,
  }).returning();

  const enriched = await enrichAgent(agent);
  return res.status(201).json(enriched);
});

// GET /agents/:agentId/dashboard
router.get("/:agentId/dashboard", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId)).limit(1);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const enriched = await enrichAgent(agent);

  const recentListings = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      status: businessesTable.status,
      createdAt: businessesTable.createdAt,
      categoryName: categoriesTable.name,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .where(eq(businessesTable.agentId, agentId))
    .orderBy(desc(businessesTable.createdAt))
    .limit(5);

  const recentWithdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.agentId, agentId))
    .orderBy(desc(withdrawalsTable.createdAt))
    .limit(5);

  return res.json({ agent: enriched, recentListings, recentWithdrawals });
});

// GET /agents/:agentId/listings — ALL listings with category
router.get("/:agentId/listings", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const listings = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      status: businessesTable.status,
      address: businessesTable.address,
      phone: businessesTable.phone,
      verified: businessesTable.verified,
      createdAt: businessesTable.createdAt,
      categoryName: categoriesTable.name,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .where(eq(businessesTable.agentId, agentId))
    .orderBy(desc(businessesTable.createdAt));

  return res.json(listings);
});

// POST /agents/:agentId/businesses — agent submits a business (always pending)
router.post("/:agentId/businesses", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId)).limit(1);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const {
    name, description, categoryId,
    stateName, cityName, areaName, streetName,
    address, phone, whatsapp, website,
    latitude, longitude, openingHours,
    photos = [],
  } = req.body;

  if (!name || !categoryId || !cityName || !areaName || !streetName) {
    return res.status(400).json({ error: "name, categoryId, cityName, areaName, streetName are required" });
  }

  let cityRows = await db.select().from(citiesTable)
    .where(and(ilike(citiesTable.name, cityName), ilike(citiesTable.state, stateName || "%")))
    .limit(1);
  let city = cityRows[0];
  if (!city) {
    const inserted = await db.insert(citiesTable).values({ name: cityName, state: stateName || "Unknown", country: "Nigeria" }).returning();
    city = inserted[0];
  }

  let areaRows = await db.select().from(areasTable).where(and(ilike(areasTable.name, areaName), eq(areasTable.cityId, city.id))).limit(1);
  let area = areaRows[0];
  if (!area) {
    const inserted = await db.insert(areasTable).values({ name: areaName, cityId: city.id }).returning();
    area = inserted[0];
  }

  let streetRows = await db.select().from(streetsTable).where(and(ilike(streetsTable.name, streetName), eq(streetsTable.areaId, area.id))).limit(1);
  let street = streetRows[0];
  if (!street) {
    const inserted = await db.insert(streetsTable).values({ name: streetName, areaId: area.id }).returning();
    street = inserted[0];
  }

  const [biz] = await db.insert(businessesTable).values({
    name,
    description: description || null,
    categoryId: Number(categoryId),
    streetId: street.id,
    address: address || null,
    phone: phone || null,
    whatsapp: whatsapp || null,
    website: website || null,
    latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
    longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
    openingHours: openingHours || null,
    status: "pending",
    verified: false,
    featured: false,
    agentId,
  }).returning();

  if (Array.isArray(photos) && photos.length > 0) {
    await db.insert(businessPhotosTable).values(
      photos.slice(0, 10).map((p: { url: string; caption?: string }) => ({
        businessId: biz.id, url: p.url, caption: p.caption ?? null,
      }))
    );
  }

  return res.status(201).json({ ...biz, streetName: street.name, areaName: area.name, cityName: city.name });
});

// PUT /agents/:agentId/profile — update agent profile
router.put("/:agentId/profile", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const { fullName, age, address, bankName, accountNumber, accountName, passportPhotoUrl, idType, idNumber } = req.body;

  const [agent] = await db.update(agentsTable)
    .set({
      ...(fullName !== undefined && { fullName }),
      ...(age !== undefined && { age: age ? Number(age) : null }),
      ...(address !== undefined && { address }),
      ...(bankName !== undefined && { bankName }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(accountName !== undefined && { accountName }),
      ...(passportPhotoUrl !== undefined && { passportPhotoUrl }),
      ...(idType !== undefined && { idType }),
      ...(idNumber !== undefined && { idNumber }),
    })
    .where(eq(agentsTable.id, agentId))
    .returning();

  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const enriched = await enrichAgent(agent);
  return res.json(enriched);
});

// POST /agents/:agentId/withdraw
router.post("/:agentId/withdraw", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId)).limit(1);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (agent.availableBalance < Number(amount)) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    agentId,
    amount: Number(amount),
  }).returning();

  await db.update(agentsTable)
    .set({ availableBalance: agent.availableBalance - Number(amount) })
    .where(eq(agentsTable.id, agentId));

  return res.status(201).json(withdrawal);
});

// GET /agents/leaderboard
router.get("/leaderboard", async (_req, res) => {
  const agents = await db.select().from(agentsTable)
    .where(eq(agentsTable.status, "approved"))
    .orderBy(desc(agentsTable.totalEarnings))
    .limit(10);

  const enriched = await Promise.all(agents.map(async (agent, i) => {
    const e = await enrichAgent(agent);
    return {
      rank: i + 1,
      agentId: agent.id,
      userName: e.userName,
      approvedListings: e.approvedListings,
      totalEarnings: agent.totalEarnings,
    };
  }));

  return res.json(enriched);
});

export default router;

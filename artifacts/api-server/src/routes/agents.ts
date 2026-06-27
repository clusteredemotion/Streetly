import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, usersTable, withdrawalsTable, businessesTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";

const router = Router();

async function enrichAgent(agent: typeof agentsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, agent.userId)).limit(1);
  const [listingsCount] = await db.select({ count: count() }).from(businessesTable).where(eq(businessesTable.agentId, agent.id));
  const [approvedCount] = await db.select({ count: count() }).from(businessesTable)
    .where(eq(businessesTable.agentId, agent.id));

  return {
    ...agent,
    userName: user?.name ?? "Unknown",
    userEmail: user?.email ?? "",
    totalListings: Number(listingsCount.count),
    approvedListings: Number(approvedCount.count),
  };
}

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

  const userId = req.body.userId ?? 1;

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

  const recentListings = await db.select().from(businessesTable)
    .where(eq(businessesTable.agentId, agentId))
    .orderBy(desc(businessesTable.createdAt))
    .limit(5);

  const recentWithdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.agentId, agentId))
    .orderBy(desc(withdrawalsTable.createdAt))
    .limit(5);

  return res.json({ agent: enriched, recentListings, recentWithdrawals });
});

// GET /agents/:agentId/listings
router.get("/:agentId/listings", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const listings = await db.select().from(businessesTable)
    .where(eq(businessesTable.agentId, agentId))
    .orderBy(desc(businessesTable.createdAt));

  return res.json(listings);
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

import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable, agentsTable, usersTable, withdrawalsTable, businessClaimsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

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

import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, usersTable, businessesTable, businessPhotosTable, withdrawalsTable } from "@workspace/db";
import { eq, desc, inArray, sql, and } from "drizzle-orm";
import { requireRole } from "../lib/authHelpers";

const router = Router();

// Explicit allow-list of exactly one role. Uses the shared requireRole
// middleware (same token-parsing + deny-all logic as /admin/*) instead of a
// bespoke base64 decode, so this route family can't drift from the rest of
// the app's auth behavior.
router.use(requireRole("regional_manager"));

// requireRole attaches the full user row to req.currentUser; keep
// req.managerId around since the handlers below already reference it.
router.use((req: any, _res, next) => {
  req.managerId = req.currentUser.id;
  next();
});

// GET /regional-manager/summary — aggregated stats for this manager's region
router.get("/summary", async (req: any, res) => {
  const myAgents = await db
    .select({ id: agentsTable.id, totalEarnings: agentsTable.totalEarnings, status: agentsTable.status })
    .from(agentsTable)
    .where(eq(agentsTable.managerId, req.managerId));

  const agentIds = myAgents.map((a) => a.id);
  const totalAgents = myAgents.length;
  const pendingAgents = myAgents.filter((a) => a.status === "pending").length;
  const cumulativeEarnings = myAgents.reduce((sum, a) => sum + a.totalEarnings, 0);

  let totalBusinesses = 0;
  let totalPaidOut = 0;

  if (agentIds.length > 0) {
    const [bizRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessesTable)
      .where(inArray(businessesTable.agentId, agentIds));
    totalBusinesses = bizRow?.count ?? 0;

    const [paidRow] = await db
      .select({ total: sql<number>`coalesce(sum(${withdrawalsTable.amount}), 0)::float` })
      .from(withdrawalsTable)
      .where(and(inArray(withdrawalsTable.agentId, agentIds), eq(withdrawalsTable.status, "completed")));
    totalPaidOut = paidRow?.total ?? 0;
  }

  return res.json({
    totalAgents,
    pendingAgents,
    totalBusinesses,
    cumulativeEarnings,
    totalPaidOut,
  });
});

// GET /regional-manager/earnings-trend — commission totals over time for this manager's agents
// period=day -> last 14 days, period=week -> last 12 weeks, period=month -> last 12 months
router.get("/earnings-trend", async (req: any, res) => {
  const period = ["day", "week", "month"].includes(req.query.period) ? req.query.period : "month";
  const config = {
    day: { unit: "day", span: "13 days", fmt: "Mon DD" },
    week: { unit: "week", span: "11 weeks", fmt: "Mon DD" },
    month: { unit: "month", span: "11 months", fmt: "Mon 'YY" },
  }[period as "day" | "week" | "month"];

  const myAgents = await db
    .select({ id: agentsTable.id })
    .from(agentsTable)
    .where(eq(agentsTable.managerId, req.managerId));
  const agentIds = myAgents.map((a) => a.id);

  if (agentIds.length === 0) {
    return res.json({ period, data: [] });
  }

  const rows = await db.execute(sql`
    WITH periods AS (
      SELECT generate_series(
        date_trunc(${config.unit}, NOW() - INTERVAL ${sql.raw(`'${config.span}'`)}),
        date_trunc(${config.unit}, NOW()),
        ${sql.raw(`'1 ${config.unit}'::interval`)}
      ) AS p
    )
    SELECT
      TO_CHAR(periods.p, ${config.fmt}) AS label,
      COALESCE(SUM(w.amount) FILTER (WHERE w.status = 'completed'), 0)::float AS "paidOut",
      COALESCE(SUM(w.amount), 0)::float AS "totalRequested"
    FROM periods
    LEFT JOIN withdrawals w
      ON date_trunc(${config.unit}, w.created_at) = periods.p
      AND w.agent_id IN (${sql.join(agentIds.map((id) => sql`${id}`), sql`, `)})
    GROUP BY periods.p
    ORDER BY periods.p
  `);

  return res.json({
    period,
    data: (rows.rows as any[]).map((r) => ({
      label: r.label,
      paidOut: Number(r.paidOut),
      totalRequested: Number(r.totalRequested),
    })),
  });
});

// GET /regional-manager/agents — all agents assigned to this manager
router.get("/agents", async (req: any, res) => {
  const rows = await db
    .select({
      id: agentsTable.id,
      userId: agentsTable.userId,
      status: agentsTable.status,
      fullName: agentsTable.fullName,
      age: agentsTable.age,
      address: agentsTable.address,
      bankName: agentsTable.bankName,
      accountNumber: agentsTable.accountNumber,
      accountName: agentsTable.accountName,
      idType: agentsTable.idType,
      idNumber: agentsTable.idNumber,
      totalEarnings: agentsTable.totalEarnings,
      availableBalance: agentsTable.availableBalance,
      passportPhotoUrl: agentsTable.passportPhotoUrl,
      ninSlipUrl: agentsTable.ninSlipUrl,
      latitude: agentsTable.latitude,
      longitude: agentsTable.longitude,
      createdAt: agentsTable.createdAt,
      managerId: agentsTable.managerId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      msaId: usersTable.msaId,
    })
    .from(agentsTable)
    .leftJoin(usersTable, eq(agentsTable.userId, usersTable.id))
    .where(eq(agentsTable.managerId, req.managerId))
    .orderBy(desc(agentsTable.createdAt));
  return res.json(rows);
});

// GET /regional-manager/agents/:id — single agent full profile
router.get("/agents/:id", async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db
    .select({
      id: agentsTable.id,
      userId: agentsTable.userId,
      status: agentsTable.status,
      fullName: agentsTable.fullName,
      age: agentsTable.age,
      address: agentsTable.address,
      bankName: agentsTable.bankName,
      accountNumber: agentsTable.accountNumber,
      accountName: agentsTable.accountName,
      idType: agentsTable.idType,
      idNumber: agentsTable.idNumber,
      totalEarnings: agentsTable.totalEarnings,
      availableBalance: agentsTable.availableBalance,
      passportPhotoUrl: agentsTable.passportPhotoUrl,
      ninSlipUrl: agentsTable.ninSlipUrl,
      latitude: agentsTable.latitude,
      longitude: agentsTable.longitude,
      createdAt: agentsTable.createdAt,
      managerId: agentsTable.managerId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      msaId: usersTable.msaId,
    })
    .from(agentsTable)
    .leftJoin(usersTable, eq(agentsTable.userId, usersTable.id))
    .where(eq(agentsTable.id, id))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Agent not found" });
  if (row.managerId !== req.managerId) return res.status(403).json({ error: "Not your agent" });
  return res.json(row);
});

// GET /regional-manager/agents/:id/businesses — businesses registered by this agent (with photos)
router.get("/agents/:id/businesses", async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [agent] = await db.select({ managerId: agentsTable.managerId })
    .from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (agent.managerId !== req.managerId) return res.status(403).json({ error: "Not your agent" });

  const businesses = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      address: businessesTable.address,
      status: businessesTable.status,
      verified: businessesTable.verified,
      createdAt: businessesTable.createdAt,
    })
    .from(businessesTable)
    .where(eq(businessesTable.agentId, id))
    .orderBy(desc(businessesTable.createdAt));

  const result = await Promise.all(
    businesses.map(async (biz) => {
      const photos = await db.select({ id: businessPhotosTable.id, url: businessPhotosTable.url, caption: businessPhotosTable.caption })
        .from(businessPhotosTable)
        .where(eq(businessPhotosTable.businessId, biz.id));
      return { ...biz, photos };
    })
  );
  return res.json(result);
});

// GET /regional-manager/agents/:id/commissions — withdrawal/commission rows for this agent
router.get("/agents/:id/commissions", async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [agent] = await db.select({ managerId: agentsTable.managerId })
    .from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  if (agent.managerId !== req.managerId) return res.status(403).json({ error: "Not your agent" });

  const commissions = await db.select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.agentId, id))
    .orderBy(desc(withdrawalsTable.createdAt));
  return res.json(commissions);
});

export default router;

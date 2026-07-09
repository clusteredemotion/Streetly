import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, usersTable, businessesTable, businessPhotosTable, withdrawalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function getUserIdFromAuthHeader(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const payload = JSON.parse(Buffer.from(h.slice(7), "base64").toString());
    if (typeof payload?.userId !== "number") return null;
    if (typeof payload?.exp === "number" && payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

async function requireRegionalManager(req: any, res: any, next: any) {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.role !== "regional_manager") { res.status(403).json({ error: "Forbidden" }); return; }
  const [flagRow] = await db.select({ mustChangePassword: usersTable.mustChangePassword }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (flagRow?.mustChangePassword) { res.status(403).json({ error: "You must change your password before continuing", code: "PASSWORD_CHANGE_REQUIRED" }); return; }
  req.managerId = userId;
  next();
}

router.use(requireRegionalManager);

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

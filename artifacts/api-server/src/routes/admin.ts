import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  businessesTable, agentsTable, usersTable, withdrawalsTable,
  businessClaimsTable, businessPhotosTable, categoriesTable,
  citiesTable, areasTable, streetsTable,
} from "@workspace/db";
import { eq, count, sql, ilike, and, desc } from "drizzle-orm";

const router = Router();

/* ── tiny token helpers (same algo as auth.ts) ── */
function generateToken(userId: number): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

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

// GET /admin/businesses/all — all businesses with category/street/agent info
router.get("/businesses/all", async (_req, res) => {
  const rows = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      description: businessesTable.description,
      phone: businessesTable.phone,
      whatsapp: businessesTable.whatsapp,
      website: businessesTable.website,
      instagramUrl: businessesTable.instagramUrl,
      facebookUrl: businessesTable.facebookUrl,
      tiktokUrl: businessesTable.tiktokUrl,
      youtubeUrl: businessesTable.youtubeUrl,
      address: businessesTable.address,
      openingHours: businessesTable.openingHours,
      latitude: businessesTable.latitude,
      longitude: businessesTable.longitude,
      status: businessesTable.status,
      verified: businessesTable.verified,
      featured: businessesTable.featured,
      categoryId: businessesTable.categoryId,
      streetId: businessesTable.streetId,
      createdAt: businessesTable.createdAt,
      categoryName: categoriesTable.name,
      streetName: streetsTable.name,
      agentId: businessesTable.agentId,
      agentFullName: agentsTable.fullName,
      agentUserName: usersTable.name,
      agentUserEmail: usersTable.email,
      agentBankName: agentsTable.bankName,
      agentAccountNumber: agentsTable.accountNumber,
      agentAccountName: agentsTable.accountName,
      agentStatus: agentsTable.status,
      agentPassportPhotoUrl: agentsTable.passportPhotoUrl,
      agentIdType: agentsTable.idType,
      agentIdNumber: agentsTable.idNumber,
      agentAddress: agentsTable.address,
      agentTotalEarnings: agentsTable.totalEarnings,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .leftJoin(streetsTable, eq(businessesTable.streetId, streetsTable.id))
    .leftJoin(agentsTable, eq(businessesTable.agentId, agentsTable.id))
    .leftJoin(usersTable, eq(agentsTable.userId, usersTable.id))
    .orderBy(desc(businessesTable.createdAt));
  return res.json(rows);
});

// GET /admin/businesses/featured — featured+approved businesses ordered by sort_order
router.get("/businesses/featured", async (_req, res) => {
  const rows = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      categoryName: categoriesTable.name,
      sortOrder: businessesTable.sortOrder,
      verified: businessesTable.verified,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .where(and(eq(businessesTable.featured, true), eq(businessesTable.status, "approved")))
    .orderBy(sql`sort_order NULLS LAST`, businessesTable.id);
  return res.json(rows);
});

// PUT /admin/businesses/featured-order — save new sort order
router.put("/businesses/featured-order", async (req, res) => {
  const { order } = req.body as { order: Array<{ id: number; sortOrder: number }> };
  if (!Array.isArray(order)) return res.status(400).json({ error: "order array required" });
  await Promise.all(
    order.map(({ id, sortOrder }) =>
      db.update(businessesTable).set({ sortOrder }).where(eq(businessesTable.id, id))
    )
  );
  return res.json({ ok: true });
});

// PUT /admin/businesses/:id — edit any business
router.put("/businesses/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { name, description, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl, youtubeUrl, openingHours, status, verified, featured, latitude, longitude } = req.body;
  const [biz] = await db.update(businessesTable)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(phone !== undefined && { phone }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(website !== undefined && { website }),
      ...(instagramUrl !== undefined && { instagramUrl }),
      ...(facebookUrl !== undefined && { facebookUrl }),
      ...(tiktokUrl !== undefined && { tiktokUrl }),
      ...(youtubeUrl !== undefined && { youtubeUrl }),
      ...(openingHours !== undefined && { openingHours }),
      ...(status !== undefined && { status }),
      ...(verified !== undefined && { verified: Boolean(verified) }),
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(latitude !== undefined && { latitude: latitude === "" ? null : Number(latitude) }),
      ...(longitude !== undefined && { longitude: longitude === "" ? null : Number(longitude) }),
    })
    .where(eq(businessesTable.id, id))
    .returning();

  if (!biz) return res.status(404).json({ error: "Business not found" });
  return res.json(biz);
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

  const [biz] = await db.update(businessesTable)
    .set({ status, verified: !!approved })
    .where(eq(businessesTable.id, id))
    .returning();

  if (!biz) return res.status(404).json({ error: "Business not found" });

  if (approved && biz.agentId) {
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, biz.agentId)).limit(1);
    if (agent) {
      const commission = 100;
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

// GET /admin/agents/all — all agents with user info
router.get("/agents/all", async (_req, res) => {
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
      createdAt: agentsTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userRole: usersTable.role,
    })
    .from(agentsTable)
    .leftJoin(usersTable, eq(agentsTable.userId, usersTable.id))
    .orderBy(agentsTable.createdAt);
  return res.json(rows);
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

// PUT /admin/agents/:id — edit agent
router.put("/agents/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { fullName, age, address, bankName, accountNumber, accountName, idType, idNumber, status } = req.body;
  const [agent] = await db.update(agentsTable)
    .set({
      ...(fullName !== undefined && { fullName }),
      ...(age !== undefined && { age: Number(age) }),
      ...(address !== undefined && { address }),
      ...(bankName !== undefined && { bankName }),
      ...(accountNumber !== undefined && { accountNumber }),
      ...(accountName !== undefined && { accountName }),
      ...(idType !== undefined && { idType }),
      ...(idNumber !== undefined && { idNumber }),
      ...(status !== undefined && { status }),
    })
    .where(eq(agentsTable.id, id))
    .returning();

  if (!agent) return res.status(404).json({ error: "Agent not found" });
  return res.json(agent);
});

// GET /admin/users/all
router.get("/users/all", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, createdAt: usersTable.createdAt,
      registrationIp: usersTable.registrationIp,
      passwordHash: usersTable.passwordHash,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  return res.json(users);
});

// PUT /admin/users/:id — edit user
router.put("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { name, email, role } = req.body;
  const [user] = await db.update(usersTable)
    .set({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
    })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
});

// POST /admin/users/:id/reset-password — admin sets a new password for a user
router.post("/users/:id/reset-password", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const hash = crypto.createHash("sha256").update(newPassword + "streetly_salt").digest("hex");
  const [user] = await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, id)).returning();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ ok: true });
});

// POST /admin/impersonate/:userId — return a token for that user
router.post("/impersonate/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = generateToken(user.id);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /admin/withdrawals — pending withdrawal requests
router.get("/withdrawals", async (_req, res) => {
  const rows = await db
    .select({
      id: withdrawalsTable.id,
      agentId: withdrawalsTable.agentId,
      amount: withdrawalsTable.amount,
      status: withdrawalsTable.status,
      createdAt: withdrawalsTable.createdAt,
      agentFullName: agentsTable.fullName,
      agentBankName: agentsTable.bankName,
      agentAccountNumber: agentsTable.accountNumber,
      agentAccountName: agentsTable.accountName,
      agentAvailableBalance: agentsTable.availableBalance,
    })
    .from(withdrawalsTable)
    .leftJoin(agentsTable, eq(withdrawalsTable.agentId, agentsTable.id))
    .where(eq(withdrawalsTable.status, "pending"))
    .orderBy(withdrawalsTable.createdAt);
  return res.json(rows);
});

// PATCH /admin/withdrawals/:id/approve — approve or reject commission payout
router.patch("/withdrawals/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { approved } = req.body;
  const status = approved ? "completed" : "failed";

  const [w] = await db.update(withdrawalsTable)
    .set({ status })
    .where(eq(withdrawalsTable.id, id))
    .returning();

  if (!w) return res.status(404).json({ error: "Withdrawal not found" });

  if (approved) {
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, w.agentId)).limit(1);
    if (agent) {
      await db.update(agentsTable)
        .set({ availableBalance: Math.max(0, agent.availableBalance - w.amount) })
        .where(eq(agentsTable.id, agent.id));
    }
  }

  return res.json(w);
});

// GET /admin/categories
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

  const fullDescription = [description || "", registrationNumber ? `Registration No: ${registrationNumber}` : ""].filter(Boolean).join("\n\n") || undefined;

  const bizInsert = await db.insert(businessesTable).values({
    name, description: fullDescription,
    categoryId: Number(categoryId),
    streetId: street.id,
    address, phone, whatsapp, website,
    latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
    longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
    openingHours,
    status: publish ? "approved" : "pending",
    verified: Boolean(verified),
    featured: Boolean(featured),
  }).returning();
  const biz = bizInsert[0];

  if (Array.isArray(photos) && photos.length > 0) {
    await db.insert(businessPhotosTable).values(
      photos.slice(0, 10).map((p: { url: string; caption?: string }) => ({
        businessId: biz.id, url: p.url, caption: p.caption ?? null,
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

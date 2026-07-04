import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  businessesTable, agentsTable, usersTable, withdrawalsTable,
  businessClaimsTable, businessPhotosTable, categoriesTable,
  citiesTable, areasTable, streetsTable, messagesTable,
  supportTicketsTable, ridersTable, deliveryOrdersTable,
} from "@workspace/db";
import { eq, count, sql, ilike, and, desc, isNotNull } from "drizzle-orm";
import { generateUniqueSlug } from "./businesses";

const router = Router();

/* ── tiny token helpers (same algo as auth.ts) ── */
function generateToken(userId: number): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

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

router.use("/riders", async (req, res, next) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  next();
});

router.use("/deliveries", async (req, res, next) => {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  next();
});

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
      slug: businessesTable.slug,
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

// GET /admin/businesses/:id/photos
router.get("/businesses/:id/photos", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const photos = await db.select().from(businessPhotosTable).where(eq(businessPhotosTable.businessId, id));
  return res.json(photos);
});

// POST /admin/businesses/:id/photos — add photo
router.post("/businesses/:id/photos", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { url, caption } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  const [photo] = await db.insert(businessPhotosTable).values({ businessId: id, url, caption: caption ?? null }).returning();
  return res.status(201).json(photo);
});

// DELETE /admin/businesses/:id/photos/:photoId
router.delete("/businesses/:id/photos/:photoId", async (req, res) => {
  const photoId = parseInt(req.params.photoId);
  if (isNaN(photoId)) return res.status(400).json({ error: "Invalid photoId" });
  await db.delete(businessPhotosTable).where(eq(businessPhotosTable.id, photoId));
  return res.json({ ok: true });
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

// PATCH /admin/businesses/:id/suspend — toggle suspension
router.patch("/businesses/:id/suspend", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { suspend } = req.body;
  const [biz] = await db.update(businessesTable)
    .set({ status: suspend ? "suspended" : "approved" })
    .where(eq(businessesTable.id, id))
    .returning();
  if (!biz) return res.status(404).json({ error: "Not found" });
  return res.json(biz);
});

// DELETE /admin/businesses/:id
router.delete("/businesses/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(businessPhotosTable).where(eq(businessPhotosTable.businessId, id));
  await db.delete(businessesTable).where(eq(businessesTable.id, id));
  return res.json({ ok: true });
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
      const commission = 300;
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
      msaId: usersTable.msaId,
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

// PATCH /admin/agents/:id/suspend — toggle suspension
router.patch("/agents/:id/suspend", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { suspend } = req.body;
  const [agent] = await db.update(agentsTable)
    .set({ status: suspend ? "suspended" : "approved" })
    .where(eq(agentsTable.id, id))
    .returning();
  if (!agent) return res.status(404).json({ error: "Not found" });
  return res.json(agent);
});

// DELETE /admin/agents/:id
router.delete("/agents/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, id)).limit(1);
  if (!agent) return res.status(404).json({ error: "Not found" });
  await db.delete(agentsTable).where(eq(agentsTable.id, id));
  await db.update(usersTable).set({ role: "visitor" }).where(eq(usersTable.id, agent.userId));
  return res.json({ ok: true });
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

// GET /admin/riders/pending
router.get("/riders/pending", async (_req, res) => {
  const riders = await db.select().from(ridersTable).where(eq(ridersTable.status, "pending"));
  return res.json(riders);
});

// GET /admin/riders/all — all riders with user info
router.get("/riders/all", async (_req, res) => {
  const rows = await db
    .select({
      id: ridersTable.id,
      userId: ridersTable.userId,
      status: ridersTable.status,
      fullName: ridersTable.fullName,
      phone: ridersTable.phone,
      vehicleType: ridersTable.vehicleType,
      idType: ridersTable.idType,
      idNumber: ridersTable.idNumber,
      isOnline: ridersTable.isOnline,
      totalDeliveries: ridersTable.totalDeliveries,
      createdAt: ridersTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(ridersTable)
    .leftJoin(usersTable, eq(ridersTable.userId, usersTable.id))
    .orderBy(ridersTable.createdAt);
  return res.json(rows);
});

// PATCH /admin/riders/:id/approve
router.patch("/riders/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { approved } = req.body;
  const status = approved ? "approved" : "rejected";

  const [rider] = await db.update(ridersTable)
    .set({ status })
    .where(eq(ridersTable.id, id))
    .returning();

  if (!rider) return res.status(404).json({ error: "Rider not found" });
  return res.json(rider);
});

// PATCH /admin/riders/:id/suspend — toggle suspension
router.patch("/riders/:id/suspend", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { suspend } = req.body;
  const [rider] = await db.update(ridersTable)
    .set({ status: suspend ? "suspended" : "approved", ...(suspend && { isOnline: false }) })
    .where(eq(ridersTable.id, id))
    .returning();
  if (!rider) return res.status(404).json({ error: "Not found" });
  return res.json(rider);
});

// DELETE /admin/riders/:id
router.delete("/riders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [rider] = await db.select().from(ridersTable).where(eq(ridersTable.id, id)).limit(1);
  if (!rider) return res.status(404).json({ error: "Not found" });
  await db.delete(ridersTable).where(eq(ridersTable.id, id));
  await db.update(usersTable).set({ role: "visitor" }).where(eq(usersTable.id, rider.userId));
  return res.json({ ok: true });
});

// GET /admin/deliveries/all — all delivery orders with business/rider info
router.get("/deliveries/all", async (_req, res) => {
  const rows = await db
    .select({
      id: deliveryOrdersTable.id,
      businessId: deliveryOrdersTable.businessId,
      customerName: deliveryOrdersTable.customerName,
      customerPhone: deliveryOrdersTable.customerPhone,
      deliveryAddress: deliveryOrdersTable.deliveryAddress,
      status: deliveryOrdersTable.status,
      riderId: deliveryOrdersTable.riderId,
      createdAt: deliveryOrdersTable.createdAt,
      businessName: businessesTable.name,
      riderFullName: ridersTable.fullName,
    })
    .from(deliveryOrdersTable)
    .leftJoin(businessesTable, eq(deliveryOrdersTable.businessId, businessesTable.id))
    .leftJoin(ridersTable, eq(deliveryOrdersTable.riderId, ridersTable.id))
    .orderBy(desc(deliveryOrdersTable.createdAt));
  return res.json(rows);
});

// GET /admin/users/all
router.get("/users/all", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, status: usersTable.status, createdAt: usersTable.createdAt,
      registrationIp: usersTable.registrationIp,
      passwordHash: usersTable.passwordHash,
      msaId: usersTable.msaId,
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
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt });
});

// PATCH /admin/users/:id/suspend — toggle user suspension
router.patch("/users/:id/suspend", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { suspend } = req.body;
  const [user] = await db.update(usersTable)
    .set({ status: suspend ? "suspended" : "active" })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json({ id: user.id, name: user.name, status: user.status });
});

// DELETE /admin/users/:id
router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.json({ ok: true });
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

// POST /admin/categories
router.post("/categories", async (req, res) => {
  const { name, icon } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Category name is required" });
  const [cat] = await db.insert(categoriesTable).values({ name: name.trim(), icon: icon ?? "Store" }).returning();
  return res.status(201).json(cat);
});

// PUT /admin/categories/:id
router.put("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { name, icon } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name.trim();
  if (icon !== undefined) updates.icon = icon;
  const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!cat) return res.status(404).json({ error: "Category not found" });
  return res.json(cat);
});

// DELETE /admin/categories/:id
router.delete("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  return res.json({ ok: true });
});

// PUT /admin/users/:userId/msa-id — reassign MSA ID
router.put("/users/:userId/msa-id", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });
  const { msaId } = req.body;
  if (!msaId?.trim()) return res.status(400).json({ error: "msaId is required" });
  const existing = await db.select().from(usersTable).where(eq(usersTable.msaId, msaId.trim())).limit(1);
  if (existing.length > 0 && existing[0].id !== userId) {
    return res.status(400).json({ error: "This MSA ID is already assigned to another user" });
  }
  const [user] = await db.update(usersTable).set({ msaId: msaId.trim() }).where(eq(usersTable.id, userId)).returning();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ ok: true, msaId: user.msaId });
});

// GET /admin/kyc — all agents with their KYC documents
router.get("/kyc", async (_req, res) => {
  const rows = await db
    .select({
      id: agentsTable.id,
      userId: agentsTable.userId,
      status: agentsTable.status,
      fullName: agentsTable.fullName,
      idType: agentsTable.idType,
      idNumber: agentsTable.idNumber,
      passportPhotoUrl: agentsTable.passportPhotoUrl,
      ninSlipUrl: agentsTable.ninSlipUrl,
      createdAt: agentsTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(agentsTable)
    .leftJoin(usersTable, eq(agentsTable.userId, usersTable.id))
    .where(and(
      isNotNull(agentsTable.passportPhotoUrl),
    ))
    .orderBy(desc(agentsTable.createdAt));
  return res.json(rows);
});

// GET /admin/analytics
router.get("/analytics", async (_req, res) => {
  try {
    const growthRaw = await db.execute(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '11 months'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) AS m
      )
      SELECT TO_CHAR(m.m, 'Mon ''YY') AS month, COALESCE(COUNT(b.id), 0)::int AS count
      FROM months m
      LEFT JOIN businesses b ON date_trunc('month', b.created_at) = m.m
      GROUP BY m.m ORDER BY m.m
    `);
    let cumulative = 0;
    const businessGrowth = (growthRaw.rows as any[]).map(r => {
      cumulative += Number(r.count);
      return { month: r.month, count: Number(r.count), cumulative };
    });

    const catRaw = await db.execute(sql`
      SELECT c.name, COUNT(b.id)::int AS count
      FROM businesses b JOIN categories c ON b.category_id = c.id
      GROUP BY c.name ORDER BY count DESC LIMIT 10
    `);

    const statusRaw = await db.execute(sql`
      SELECT status, COUNT(*)::int AS count FROM businesses GROUP BY status ORDER BY count DESC
    `);

    const cityRaw = await db.execute(sql`
      SELECT ci.name AS city, COUNT(b.id)::int AS count
      FROM businesses b
      JOIN streets s ON b.street_id = s.id
      JOIN areas a ON s.area_id = a.id
      JOIN cities ci ON a.city_id = ci.id
      GROUP BY ci.name ORDER BY count DESC LIMIT 8
    `);

    const agentGrowthRaw = await db.execute(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '11 months'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) AS m
      )
      SELECT TO_CHAR(m.m, 'Mon ''YY') AS month, COALESCE(COUNT(a.id), 0)::int AS count
      FROM months m
      LEFT JOIN agents a ON date_trunc('month', a.created_at) = m.m
      GROUP BY m.m ORDER BY m.m
    `);

    const [bizCount] = await db.select({ count: count() }).from(businessesTable);
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [agentCount] = await db.select({ count: count() }).from(agentsTable);

    return res.json({
      businessGrowth,
      categoryBreakdown: (catRaw.rows as any[]).map(r => ({ name: r.name, count: Number(r.count) })),
      statusBreakdown: (statusRaw.rows as any[]).map(r => ({ status: r.status, count: Number(r.count) })),
      cityBreakdown: (cityRaw.rows as any[]).map(r => ({ city: r.city, count: Number(r.count) })),
      agentGrowth: (agentGrowthRaw.rows as any[]).map(r => ({ month: r.month, count: Number(r.count) })),
      totalBusinesses: Number(bizCount.count),
      totalUsers: Number(userCount.count),
      totalAgents: Number(agentCount.count),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /admin/messages
router.get("/messages", async (_req, res) => {
  const msgs = await db
    .select({
      id: messagesTable.id,
      recipientType: messagesTable.recipientType,
      recipientId: messagesTable.recipientId,
      subject: messagesTable.subject,
      body: messagesTable.body,
      sentAt: messagesTable.sentAt,
      recipientName: usersTable.name,
      recipientEmail: usersTable.email,
    })
    .from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.recipientId, usersTable.id))
    .orderBy(desc(messagesTable.sentAt));
  return res.json(msgs);
});

// POST /admin/messages
router.post("/messages", async (req, res) => {
  const { recipientType, recipientId, subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ error: "subject and body required" });
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");
  let senderId: number | null = null;
  try { senderId = JSON.parse(Buffer.from(token, "base64").toString()).userId; } catch {}
  const [msg] = await db.insert(messagesTable).values({
    senderId,
    recipientType: recipientType ?? "all",
    recipientId: recipientId ? Number(recipientId) : null,
    subject,
    body,
  }).returning();
  return res.status(201).json(msg);
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
  const slug = await generateUniqueSlug(name);

  const bizInsert = await db.insert(businessesTable).values({
    name, slug, description: fullDescription,
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

/* ─────────────────────── SETTINGS ROUTES ─────────────────────── */

// GET /admin/settings
router.get("/settings", async (_req, res) => {
  const rows = await db.execute(sql`SELECT key, value FROM settings ORDER BY key`);
  const settings: Record<string, string> = {};
  for (const row of rows.rows as { key: string; value: string | null }[]) {
    settings[row.key] = row.value ?? "";
  }
  return res.json(settings);
});

// PUT /admin/settings
router.put("/settings", async (req, res) => {
  const updates: Record<string, string> = req.body;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  for (const [key, value] of Object.entries(updates)) {
    await db.execute(
      sql`INSERT INTO settings (key, value, updated_at) VALUES (${key}, ${value}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
    );
  }
  return res.json({ ok: true });
});

// PUT /admin/settings/admin-credentials — update admin login email/password
router.put("/settings/admin-credentials", async (req, res) => {
  const { email, password } = req.body;
  const updates: Record<string, string> = {};
  if (email) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0 && existing[0].role !== "admin") {
      return res.status(400).json({ error: "Email already in use by another account." });
    }
    await db.update(usersTable).set({ email }).where(eq(usersTable.role, "admin" as any));
    updates.admin_login_email = email;
  }
  if (password) {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update(password + "streetly_salt").digest("hex");
    await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.role, "admin" as any));
  }
  if (Object.keys(updates).length > 0) {
    for (const [key, value] of Object.entries(updates)) {
      await db.execute(
        sql`INSERT INTO settings (key, value, updated_at) VALUES (${key}, ${value}, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
      );
    }
  }
  return res.json({ ok: true });
});

/* ─────────────────────── CSV EXPORT ROUTES ─────────────────────── */

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map(r => r.map(escape).join(",")).join("\n");
}

// GET /admin/export/users
router.get("/export/users", async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  const csv = toCsv(
    ["ID", "Name", "Email", "Role", "Status", "MSA ID", "Registration IP", "Joined At"],
    users.map(u => [u.id, u.name, u.email, u.role, u.status, u.msaId ?? "", u.registrationIp ?? "", u.createdAt.toISOString()])
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="streetly-users-${Date.now()}.csv"`);
  return res.send(csv);
});

// GET /admin/export/agents
router.get("/export/agents", async (req, res) => {
  const agents = await db
    .select({
      agentId: agentsTable.id,
      userId: agentsTable.userId,
      userName: usersTable.name,
      email: usersTable.email,
      msaId: usersTable.msaId,
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
      createdAt: agentsTable.createdAt,
    })
    .from(agentsTable)
    .leftJoin(usersTable, eq(agentsTable.userId, usersTable.id))
    .orderBy(agentsTable.id);

  const csv = toCsv(
    ["Agent ID", "User ID", "Name", "Email", "MSA ID", "Status", "Full Name", "Age", "Address",
     "Bank Name", "Account Number", "Account Name", "ID Type", "ID Number",
     "Total Earnings (₦)", "Available Balance (₦)", "Joined At"],
    agents.map(a => [
      a.agentId, a.userId, a.userName ?? "", a.email ?? "", a.msaId ?? "",
      a.status ?? "", a.fullName ?? "", a.age ?? "", a.address ?? "",
      a.bankName ?? "", a.accountNumber ?? "", a.accountName ?? "",
      a.idType ?? "", a.idNumber ?? "",
      a.totalEarnings ?? 0, a.availableBalance ?? 0,
      a.createdAt.toISOString(),
    ])
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="streetly-agents-${Date.now()}.csv"`);
  return res.send(csv);
});

// GET /admin/export/businesses
router.get("/export/businesses", async (req, res) => {
  const businesses = await db
    .select({
      id: businessesTable.id,
      name: businessesTable.name,
      slug: businessesTable.slug,
      description: businessesTable.description,
      category: categoriesTable.name,
      address: businessesTable.address,
      phone: businessesTable.phone,
      whatsapp: businessesTable.whatsapp,
      website: businessesTable.website,
      instagram: businessesTable.instagramUrl,
      facebook: businessesTable.facebookUrl,
      tiktok: businessesTable.tiktokUrl,
      youtube: businessesTable.youtubeUrl,
      openingHours: businessesTable.openingHours,
      status: businessesTable.status,
      verified: businessesTable.verified,
      featured: businessesTable.featured,
      plan: businessesTable.plan,
      latitude: businessesTable.latitude,
      longitude: businessesTable.longitude,
      createdAt: businessesTable.createdAt,
    })
    .from(businessesTable)
    .leftJoin(categoriesTable, eq(businessesTable.categoryId, categoriesTable.id))
    .orderBy(businessesTable.id);

  const csv = toCsv(
    ["ID", "Name", "Slug", "Description", "Category", "Address", "Phone", "WhatsApp",
     "Website", "Instagram", "Facebook", "TikTok", "YouTube", "Opening Hours",
     "Status", "Verified", "Featured", "Plan", "Latitude", "Longitude", "Created At"],
    businesses.map(b => [
      b.id, b.name, b.slug ?? "", b.description ?? "", b.category ?? "",
      b.address ?? "", b.phone ?? "", b.whatsapp ?? "",
      b.website ?? "", b.instagram ?? "", b.facebook ?? "", b.tiktok ?? "", b.youtube ?? "",
      b.openingHours ?? "", b.status, b.verified, b.featured, b.plan,
      b.latitude ?? "", b.longitude ?? "", b.createdAt.toISOString(),
    ])
  );
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="streetly-businesses-${Date.now()}.csv"`);
  return res.send(csv);
});

/* ─────────────────────── SUPPORT TICKETS ─────────────────────── */

// GET /admin/support-tickets — all tickets with requester info
router.get("/support-tickets", async (_req, res) => {
  const tickets = await db
    .select({
      id: supportTicketsTable.id,
      userId: supportTicketsTable.userId,
      subject: supportTicketsTable.subject,
      message: supportTicketsTable.message,
      status: supportTicketsTable.status,
      createdAt: supportTicketsTable.createdAt,
      updatedAt: supportTicketsTable.updatedAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userRole: usersTable.role,
    })
    .from(supportTicketsTable)
    .leftJoin(usersTable, eq(supportTicketsTable.userId, usersTable.id))
    .orderBy(desc(supportTicketsTable.updatedAt));

  return res.json(tickets);
});

export default router;

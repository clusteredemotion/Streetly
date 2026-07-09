import { Router } from "express";
import { db } from "@workspace/db";
import { marketplaceItemsTable, businessesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "./auth.js";
import { blockIfMustChangePassword } from "../lib/authHelpers";

function getUserIdFromReq(req: { headers: { authorization?: string } }): number | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const payload = verifyToken(h.slice(7));
  return payload?.userId ?? null;
}

async function requireOwnerOrAdmin(userId: number | null, businessId: number): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!userId) return { ok: false, status: 401, error: "Unauthorized" };
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return { ok: false, status: 404, error: "Business not found" };
  const [requester] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const isOwner = business.ownerId === userId;
  const isAdmin = requester?.role === "admin";
  if (!isOwner && !isAdmin) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true };
}

const router = Router({ mergeParams: true });
const standaloneRouter = Router();
router.use(blockIfMustChangePassword);
standaloneRouter.use(blockIfMustChangePassword);

// GET /businesses/:businessId/marketplace-items — public storefront view (available items only)
router.get("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const items = await db.select().from(marketplaceItemsTable)
    .where(and(eq(marketplaceItemsTable.businessId, businessId), eq(marketplaceItemsTable.isAvailable, true)))
    .orderBy(marketplaceItemsTable.createdAt);
  return res.json(items);
});

// GET /businesses/:businessId/marketplace-items/manage — owner/admin view (includes unavailable items)
router.get("/manage", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const check = await requireOwnerOrAdmin(getUserIdFromReq(req), businessId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const items = await db.select().from(marketplaceItemsTable)
    .where(eq(marketplaceItemsTable.businessId, businessId))
    .orderBy(marketplaceItemsTable.createdAt);
  return res.json(items);
});

// POST /businesses/:businessId/marketplace-items — owner/admin adds an item
router.post("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const check = await requireOwnerOrAdmin(getUserIdFromReq(req), businessId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const { name, description, price, imageUrl } = req.body;
  if (!name || price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: "name and a non-negative price are required" });
  }

  const [item] = await db.insert(marketplaceItemsTable).values({
    businessId,
    name,
    description: description || null,
    price: Number(price),
    imageUrl: imageUrl || null,
  }).returning();

  return res.status(201).json(item);
});

// PATCH /marketplace-items/:id — owner/admin updates an item
standaloneRouter.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [item] = await db.select().from(marketplaceItemsTable).where(eq(marketplaceItemsTable.id, id)).limit(1);
  if (!item) return res.status(404).json({ error: "Item not found" });

  const check = await requireOwnerOrAdmin(getUserIdFromReq(req), item.businessId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  const { name, description, price, imageUrl, isAvailable } = req.body;
  const updates: Partial<typeof marketplaceItemsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || null;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl || null;
  if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);
  if (price !== undefined) {
    if (isNaN(Number(price)) || Number(price) < 0) return res.status(400).json({ error: "price must be a non-negative number" });
    updates.price = Number(price);
  }

  const [updated] = await db.update(marketplaceItemsTable).set(updates)
    .where(eq(marketplaceItemsTable.id, id)).returning();
  return res.json(updated);
});

// DELETE /marketplace-items/:id — owner/admin removes an item
standaloneRouter.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [item] = await db.select().from(marketplaceItemsTable).where(eq(marketplaceItemsTable.id, id)).limit(1);
  if (!item) return res.status(404).json({ error: "Item not found" });

  const check = await requireOwnerOrAdmin(getUserIdFromReq(req), item.businessId);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  await db.delete(marketplaceItemsTable).where(eq(marketplaceItemsTable.id, id));
  return res.status(204).send();
});

export default router;
export { standaloneRouter as standaloneMarketplaceItemsRouter, requireOwnerOrAdmin, getUserIdFromReq };

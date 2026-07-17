import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { userFeaturesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUserIdFromAuthHeader } from "../lib/authHelpers";
import { ALL_FEATURE_KEYS } from "../lib/featureRegistry";

const router: IRouter = Router();

async function requireAdmin(req: Request, res: Response): Promise<number | null> {
  const callerId = getUserIdFromAuthHeader(req);
  if (!callerId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  const [caller] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, callerId)).limit(1);
  if (!caller || caller.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return null; }
  return callerId;
}

router.get("/admin/users/:id/features", async (req: Request, res: Response) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  const userId = parseInt(req.params.id as string, 10);
  if (isNaN(userId)) return void res.status(400).json({ error: "Invalid user id" });
  const rows = await db.select({ featureKey: userFeaturesTable.featureKey })
    .from(userFeaturesTable).where(eq(userFeaturesTable.userId, userId));
  res.json({ features: rows.map((r) => r.featureKey) });
});

router.put("/admin/users/:id/features", async (req: Request, res: Response) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;
  const userId = parseInt(req.params.id as string, 10);
  if (isNaN(userId)) return void res.status(400).json({ error: "Invalid user id" });
  const { features } = req.body as { features?: string[] };
  if (!Array.isArray(features)) return void res.status(400).json({ error: "features must be an array" });
  const valid = features.filter((k) => ALL_FEATURE_KEYS.includes(k));
  await db.delete(userFeaturesTable).where(eq(userFeaturesTable.userId, userId));
  if (valid.length > 0) {
    await db.insert(userFeaturesTable).values(
      valid.map((key) => ({ userId, featureKey: key, grantedById: adminId }))
    );
  }
  res.json({ features: valid });
});

export default router;

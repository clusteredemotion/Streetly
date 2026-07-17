import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { userNotificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getUserIdFromAuthHeader } from "../lib/authHelpers";

const router: IRouter = Router();

async function requireAuth(req: Request, res: Response): Promise<number | null> {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

router.get("/", async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const rows = await db
    .select()
    .from(userNotificationsTable)
    .where(eq(userNotificationsTable.userId, userId))
    .orderBy(desc(userNotificationsTable.createdAt))
    .limit(60);
  res.json(rows);
});

router.get("/unread-count", async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const rows = await db
    .select({ id: userNotificationsTable.id })
    .from(userNotificationsTable)
    .where(and(eq(userNotificationsTable.userId, userId), eq(userNotificationsTable.isRead, false)));
  res.json({ count: rows.length });
});

router.post("/:id/read", async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  await db
    .update(userNotificationsTable)
    .set({ isRead: true })
    .where(and(eq(userNotificationsTable.id, id), eq(userNotificationsTable.userId, userId)));
  res.json({ ok: true });
});

router.post("/read-all", async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  await db
    .update(userNotificationsTable)
    .set({ isRead: true })
    .where(eq(userNotificationsTable.userId, userId));
  res.json({ ok: true });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  await db
    .delete(userNotificationsTable)
    .where(and(eq(userNotificationsTable.id, id), eq(userNotificationsTable.userId, userId)));
  res.json({ ok: true });
});

export default router;

import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function getUserIdFromAuthHeader(req: { headers: { authorization?: string } }): number | null {
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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromAuthHeader(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).currentUser = user;
  next();
}

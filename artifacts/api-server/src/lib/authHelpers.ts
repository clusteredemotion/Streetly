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
  if (user.mustChangePassword) {
    res.status(403).json({ error: "You must change your password before continuing", code: "PASSWORD_CHANGE_REQUIRED" });
    return;
  }
  (req as any).currentUser = user;
  next();
}

// Optional gate: does NOT require auth (routes with mixed guest/logged-in
// access keep working), but if a valid bearer token belongs to a user with
// mustChangePassword = true, blocks the request with 403. Apply via
// `router.use(blockIfMustChangePassword)` on any router that has its own
// ad-hoc token parsing instead of using requireAuth.
export async function blockIfMustChangePassword(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromAuthHeader(req);
  if (userId == null) {
    next();
    return;
  }
  const [user] = await db.select({ mustChangePassword: usersTable.mustChangePassword }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user?.mustChangePassword) {
    res.status(403).json({ error: "You must change your password before continuing", code: "PASSWORD_CHANGE_REQUIRED" });
    return;
  }
  next();
}

// Same as requireAuth but does NOT block users who still need to change their
// password — used only by the change-password endpoint itself, so a user
// flagged with mustChangePassword can still authenticate to satisfy the flag.
export async function requireAuthAllowPasswordChange(req: Request, res: Response, next: NextFunction) {
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

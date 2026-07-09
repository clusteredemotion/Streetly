import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, referralsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import crypto from "crypto";

const REFERRAL_SIGNUP_BONUS = 100;

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, code)).limit(1);
    if (!existing) return code;
  }
  return `${generateReferralCode()}${Date.now().toString(36).toUpperCase()}`;
}

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "streetly_salt").digest("hex");
}

function generateToken(userId: number): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
    return ip;
  }
  return req.socket?.remoteAddress ?? req.ip ?? "unknown";
}

async function generateMsaId(userId: number, role: string): Promise<string> {
  if (role === "admin") {
    const [ex] = await db.select().from(usersTable).where(eq(usersTable.msaId, "MSA-1")).limit(1);
    if (!ex || ex.id === userId) return "MSA-1";
    for (let n = 11; n < 10000; n++) {
      const [taken] = await db.select().from(usersTable).where(eq(usersTable.msaId, `MSA-${n}`)).limit(1);
      if (!taken) return `MSA-${n}`;
    }
    return `MSA-${Date.now()}`;
  }
  if (role === "field_agent") {
    const [res] = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "field_agent"));
    return `MSA-AGENT-${String(Number(res.c)).padStart(4, "0")}`;
  }
  const [res] = await db.select({ c: count() }).from(usersTable)
    .where(sql`role NOT IN ('admin', 'field_agent')`);
  return `MSA-USER-${String(Number(res.c)).padStart(4, "0")}`;
}

// POST /auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, role, referralCode } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const ip = getClientIp(req);

  let referrer: typeof usersTable.$inferSelect | undefined;
  if (referralCode && typeof referralCode === "string") {
    const [found] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode.trim().toUpperCase())).limit(1);
    referrer = found;
  }

  const ownReferralCode = await generateUniqueReferralCode();

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: hashPassword(password),
    role: role as "visitor" | "business_owner" | "field_agent",
    registrationIp: ip,
    referralCode: ownReferralCode,
    referredByUserId: referrer?.id ?? null,
  }).returning();

  const msaId = await generateMsaId(user.id, user.role);
  await db.update(usersTable).set({ msaId }).where(eq(usersTable.id, user.id));

  if (referrer) {
    await db.insert(referralsTable).values({
      referrerId: referrer.id,
      refereeId: user.id,
      pointsAwarded: REFERRAL_SIGNUP_BONUS,
      reason: "signup",
    });
    await db.update(usersTable)
      .set({ creditPoints: sql`${usersTable.creditPoints} + ${REFERRAL_SIGNUP_BONUS}` })
      .where(eq(usersTable.id, referrer.id));
  }

  const token = generateToken(user.id);
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, msaId, referralCode: ownReferralCode, creditPoints: user.creditPoints, createdAt: user.createdAt },
  });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user.id);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, msaId: user.msaId, createdAt: user.createdAt, mustChangePassword: user.mustChangePassword },
  });
});

// POST /auth/change-password
router.post("/change-password", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  await db.update(usersTable)
    .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false })
    .where(eq(usersTable.id, user.id));

  return res.json({ success: true });
});

// GET /auth/me
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, msaId: user.msaId, referralCode: user.referralCode, creditPoints: user.creditPoints, createdAt: user.createdAt, mustChangePassword: user.mustChangePassword });
});

export default router;

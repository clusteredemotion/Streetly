import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, referralsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendMail } from "../lib/mailer";
import { logger } from "../lib/logger";

const REFERRAL_SIGNUP_BONUS = 100;

async function verifyRecaptcha(token: unknown): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    logger.warn("reCAPTCHA: RECAPTCHA_SECRET_KEY not configured, skipping verification");
    return true;
  }
  if (!token || typeof token !== "string") return false;
  try {
    const params = new URLSearchParams({ secret, response: token });
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await resp.json()) as { success: boolean };
    return !!data.success;
  } catch (err) {
    logger.error({ err }, "reCAPTCHA verification request failed");
    return false;
  }
}

function sendWelcomeEmail(to: string, name: string) {
  sendMail({
    to,
    subject: "Welcome to Streetly!",
    text: `Hi ${name},\n\nWelcome to Streetly — the street-by-street business discovery platform! Your account has been created successfully.\n\nIf you didn't create this account, please contact our support team.\n\n— The Streetly Team`,
    html: `<p>Hi ${name},</p><p>Welcome to <strong>Streetly</strong> — the street-by-street business discovery platform! Your account has been created successfully.</p><p>If you didn't create this account, please contact our support team.</p><p>— The Streetly Team</p>`,
  }).catch((err) => logger.error({ err }, "Failed to send welcome email"));
}

function sendLoginNotificationEmail(to: string, name: string, ip: string) {
  const when = new Date().toUTCString();
  sendMail({
    to,
    subject: "New login to your Streetly account",
    text: `Hi ${name},\n\nWe noticed a new login to your Streetly account at ${when} from IP ${ip}.\n\nIf this was you, no action is needed. If you don't recognize this activity, please secure your account or contact support immediately.\n\n— The Streetly Team`,
    html: `<p>Hi ${name},</p><p>We noticed a new login to your Streetly account at ${when} from IP <strong>${ip}</strong>.</p><p>If this was you, no action is needed. If you don't recognize this activity, please secure your account or contact support immediately.</p><p>— The Streetly Team</p>`,
  }).catch((err) => logger.error({ err }, "Failed to send login notification email"));
}

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
  const { name, email, password, role, referralCode, recaptchaToken } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return res.status(400).json({ error: "reCAPTCHA verification failed. Please try again." });
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
  sendWelcomeEmail(user.email, user.name);
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
  if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user.id);
  sendLoginNotificationEmail(user.email, user.name, getClientIp(req));
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

// POST /auth/setup-password — consume a one-time link (from the welcome email) to set an initial password
router.post("/setup-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || typeof token !== "string") return res.status(400).json({ error: "Missing token" });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.passwordSetupTokenHash, tokenHash)).limit(1);
  if (!user) return res.status(400).json({ error: "Invalid or expired setup link" });
  if (!user.passwordSetupTokenExpiresAt || user.passwordSetupTokenExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired setup link" });
  }

  await db.update(usersTable)
    .set({
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
      passwordSetupTokenHash: null,
      passwordSetupTokenExpiresAt: null,
    })
    .where(eq(usersTable.id, user.id));

  const authToken = generateToken(user.id);
  return res.json({
    success: true,
    token: authToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, msaId: user.msaId, createdAt: user.createdAt },
  });
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

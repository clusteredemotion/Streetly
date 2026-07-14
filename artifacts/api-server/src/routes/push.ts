import { Router } from "express";
import webpush from "web-push";
import { db } from "@workspace/db";
import {
  pushSubscriptionsTable,
  pushTokensTable,
  pushNotificationLogsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, inArray, count } from "drizzle-orm";
import { getUserIdFromAuthHeader, requireRole } from "../lib/authHelpers";

const router = Router();

/* ─── VAPID / FCM init ─────────────────────────────────────────── */

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:admin@streetly.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

/* Lazy-init Firebase Admin so the server starts fine without credentials */
let _fcmInitialised = false;
async function getFcmMessaging() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) return null;

  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getMessaging } = await import("firebase-admin/messaging");
    if (!_fcmInitialised) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (!getApps().length) {
        initializeApp({ credential: cert(serviceAccount) });
      }
      _fcmInitialised = true;
    }
    return getMessaging();
  } catch (err) {
    console.warn("[push] Firebase Admin init failed:", err);
    return null;
  }
}

/* ─── Public: VAPID public key ─────────────────────────────────── */

router.get("/vapid-public-key", (_req, res) => {
  if (!VAPID_PUBLIC) {
    res.status(503).json({ error: "Push not configured" });
    return;
  }
  res.json({ publicKey: VAPID_PUBLIC });
});

/* ─── Web push subscription ────────────────────────────────────── */

router.post("/web-subscribe", async (req, res) => {
  const { endpoint, keys } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription object" });
    return;
  }

  const userId = getUserIdFromAuthHeader(req);

  await db
    .insert(pushSubscriptionsTable)
    .values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, userId })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { p256dh: keys.p256dh, auth: keys.auth, userId },
    });

  res.json({ ok: true });
});

/* ─── Native FCM token ─────────────────────────────────────────── */

router.post("/device-token", async (req, res) => {
  const { token, platform } = req.body ?? {};
  if (!token || !platform) {
    res.status(400).json({ error: "token and platform are required" });
    return;
  }

  const userId = getUserIdFromAuthHeader(req);

  await db
    .insert(pushTokensTable)
    .values({ token, platform, userId })
    .onConflictDoUpdate({
      target: pushTokensTable.token,
      set: { platform, userId },
    });

  res.json({ ok: true });
});

/* ─── Admin: send push notification ───────────────────────────── */

router.post(
  "/admin/send",
  requireRole("admin"),
  async (req, res) => {
    const { title, body, imageUrl, targetUrl, audience } = req.body ?? {};
    if (!title || !body) {
      res.status(400).json({ error: "title and body are required" });
      return;
    }
    if (!VAPID_PUBLIC) {
      res.status(503).json({ error: "Push not configured — set VAPID keys" });
      return;
    }

    const adminUserId = (req as any).currentUser?.id ?? null;
    const payload = JSON.stringify({ title, body, image: imageUrl, url: targetUrl });

    /* ── collect subscriptions (web) ── */
    let webSubs = await db.select().from(pushSubscriptionsTable);

    if (audience && audience !== "all") {
      if (audience.startsWith("role:")) {
        const role = audience.slice(5) as any;
        const users = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.role, role));
        const ids = new Set(users.map((u) => u.id));
        webSubs = webSubs.filter((s) => s.userId != null && ids.has(s.userId));
      } else if (audience.startsWith("user:")) {
        const uid = parseInt(audience.slice(5));
        webSubs = webSubs.filter((s) => s.userId === uid);
      }
    }

    /* ── send web push ── */
    let webSent = 0;
    const deadEndpoints: string[] = [];

    await Promise.all(
      webSubs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          webSent++;
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            deadEndpoints.push(sub.endpoint);
          } else {
            console.warn("[push] web send error:", err.message);
          }
        }
      })
    );

    /* prune dead subscriptions */
    if (deadEndpoints.length) {
      await db
        .delete(pushSubscriptionsTable)
        .where(inArray(pushSubscriptionsTable.endpoint, deadEndpoints));
    }

    /* ── collect FCM tokens ── */
    let fcmRows = await db.select().from(pushTokensTable);

    if (audience && audience !== "all") {
      if (audience.startsWith("role:")) {
        const role = audience.slice(5) as any;
        const users = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.role, role));
        const ids = new Set(users.map((u) => u.id));
        fcmRows = fcmRows.filter((t) => t.userId != null && ids.has(t.userId));
      } else if (audience.startsWith("user:")) {
        const uid = parseInt(audience.slice(5));
        fcmRows = fcmRows.filter((t) => t.userId === uid);
      }
    }

    /* ── send FCM ── */
    let fcmSent = 0;
    const messaging = await getFcmMessaging();

    if (messaging && fcmRows.length) {
      const tokens = fcmRows.map((r) => r.token);
      const BATCH = 500;
      for (let i = 0; i < tokens.length; i += BATCH) {
        const batch = tokens.slice(i, i + BATCH);
        try {
          const result = await messaging.sendEachForMulticast({
            tokens: batch,
            notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
            data: targetUrl ? { url: targetUrl } : {},
            android: { priority: "high" },
          });
          fcmSent += result.successCount;

          /* prune failed tokens */
          const deadTokens: string[] = [];
          result.responses.forEach((r: { success: boolean; error?: { code?: string } }, idx: number) => {
            if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
              deadTokens.push(batch[idx]);
            }
          });
          if (deadTokens.length) {
            await db
              .delete(pushTokensTable)
              .where(inArray(pushTokensTable.token, deadTokens));
          }
        } catch (err) {
          console.warn("[push] FCM batch error:", err);
        }
      }
    }

    /* ── log ── */
    await db.insert(pushNotificationLogsTable).values({
      title,
      body,
      imageUrl: imageUrl ?? null,
      targetUrl: targetUrl ?? null,
      audience: audience ?? "all",
      sentByUserId: adminUserId,
      webSent,
      fcmSent,
    });

    res.json({ ok: true, webSent, fcmSent });
  }
);

/* ─── Admin: notification history ─────────────────────────────── */

router.get("/admin/logs", requireRole("admin"), async (_req, res) => {
  const logs = await db
    .select()
    .from(pushNotificationLogsTable)
    .orderBy(desc(pushNotificationLogsTable.sentAt))
    .limit(50);
  res.json(logs);
});

/* ─── Admin: subscriber counts ─────────────────────────────────── */

router.get("/admin/stats", requireRole("admin"), async (_req, res) => {
  const [webCount] = await db
    .select({ count: count() })
    .from(pushSubscriptionsTable);
  const [fcmCount] = await db
    .select({ count: count() })
    .from(pushTokensTable);
  res.json({
    webSubscribers: Number(webCount?.count ?? 0),
    fcmDevices: Number(fcmCount?.count ?? 0),
    fcmConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    vapidConfigured: !!VAPID_PUBLIC,
  });
});

export default router;

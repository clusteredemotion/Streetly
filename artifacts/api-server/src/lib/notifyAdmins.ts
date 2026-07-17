import { db } from "@workspace/db";
import { pushTokensTable, usersTable, pushNotificationLogsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { logger } from "./logger";

let _fcmInitialised = false;
async function getFcmMessaging() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) return null;
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getMessaging } = await import("firebase-admin/messaging");
    if (!_fcmInitialised) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
      _fcmInitialised = true;
    }
    return getMessaging();
  } catch (err) {
    logger.warn({ err }, "[notifyAdmins] Firebase Admin init failed");
    return null;
  }
}

export async function notifyAdmins(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const messaging = await getFcmMessaging();

    const adminUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));
    if (!adminUsers.length) return;

    const adminIds = adminUsers.map((u) => u.id);
    const tokenRows = await db
      .select({ token: pushTokensTable.token })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, adminIds));

    let fcmSent = 0;

    if (messaging && tokenRows.length) {
      const tokens = tokenRows.map((r) => r.token);
      const BATCH = 500;
      for (let i = 0; i < tokens.length; i += BATCH) {
        const batch = tokens.slice(i, i + BATCH);
        try {
          const result = await messaging.sendEachForMulticast({
            tokens: batch,
            notification: { title, body },
            data: data ?? {},
            android: {
              priority: "high",
              notification: {
                channelId: "admin_alerts",
                sound: "default",
                defaultSound: true,
                visibility: "public",
              },
            },
          });

          fcmSent += result.successCount;

          const deadTokens: string[] = [];
          result.responses.forEach((r: { success: boolean; error?: { code?: string } }, idx: number) => {
            if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
              deadTokens.push(batch[idx]);
            }
          });
          if (deadTokens.length) {
            await db.delete(pushTokensTable).where(inArray(pushTokensTable.token, deadTokens));
          }
        } catch (err) {
          logger.warn({ err }, "[notifyAdmins] FCM batch send error");
        }
      }
    }

    await db.insert(pushNotificationLogsTable).values({
      title,
      body,
      audience: "admin",
      sentByUserId: null,
      webSent: 0,
      fcmSent,
    });
  } catch (err) {
    logger.warn({ err }, "[notifyAdmins] Failed to notify admins");
  }
}

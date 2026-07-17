import { db } from "@workspace/db";
import { userNotificationsTable } from "@workspace/db";
import { logger } from "./logger";

export async function createNotification(
  userId: number,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    await db.insert(userNotificationsTable).values({ userId, title, body, link: link ?? null });
  } catch (err) {
    logger.warn({ err }, "[createNotification] Failed to create notification");
  }
}

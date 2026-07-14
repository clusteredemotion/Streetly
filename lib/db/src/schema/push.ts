import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushTokensTable = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushNotificationLogsTable = pgTable("push_notification_logs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  targetUrl: text("target_url"),
  audience: text("audience").notNull(),
  sentByUserId: integer("sent_by_user_id"),
  webSent: integer("web_sent").notNull().default(0),
  fcmSent: integer("fcm_sent").notNull().default(0),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;
export type PushToken = typeof pushTokensTable.$inferSelect;
export type PushNotificationLog = typeof pushNotificationLogsTable.$inferSelect;

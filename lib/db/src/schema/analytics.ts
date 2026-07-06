import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", ["view", "click", "contact", "order"]);

export const businessAnalyticsEventsTable = pgTable("business_analytics_events", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BusinessAnalyticsEvent = typeof businessAnalyticsEventsTable.$inferSelect;

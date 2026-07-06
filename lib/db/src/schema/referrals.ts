import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  refereeId: integer("referee_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  reason: text("reason").notNull().default("signup"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Referral = typeof referralsTable.$inferSelect;

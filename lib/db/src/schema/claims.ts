import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const businessClaimsTable = pgTable("business_claims", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  claimerName: text("claimer_name").notNull(),
  claimerEmail: text("claimer_email").notNull(),
  claimerPhone: text("claimer_phone"),
  proofNote: text("proof_note"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

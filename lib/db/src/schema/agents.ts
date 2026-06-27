import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const agentStatusEnum = pgEnum("agent_status", ["pending", "approved", "rejected", "suspended"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "processing", "completed", "failed"]);

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: agentStatusEnum("status").notNull().default("pending"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  fullName: text("full_name"),
  age: integer("age"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  passportPhotoUrl: text("passport_photo_url"),
  ninSlipUrl: text("nin_slip_url"),
  totalEarnings: real("total_earnings").notNull().default(0),
  availableBalance: real("available_balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const withdrawalsTable = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true, totalEarnings: true, availableBalance: true, status: true });
export const insertWithdrawalSchema = createInsertSchema(withdrawalsTable).omit({ id: true, createdAt: true, status: true });

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;

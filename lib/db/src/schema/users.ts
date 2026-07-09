import { pgTable, serial, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["visitor", "business_owner", "field_agent", "admin", "delivery_rider", "moderator", "scout_manager", "regional_manager"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  role: userRoleEnum("role").notNull().default("visitor"),
  status: text("status").notNull().default("active"),
  msaId: text("msa_id").unique(),
  registrationIp: text("registration_ip"),
  referralCode: text("referral_code").unique(),
  referredByUserId: integer("referred_by_user_id"),
  creditPoints: integer("credit_points").notNull().default(0),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  passwordSetupTokenHash: text("password_setup_token_hash"),
  passwordSetupTokenExpiresAt: timestamp("password_setup_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

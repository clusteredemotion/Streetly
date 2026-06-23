import { pgTable, serial, text, integer, boolean, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { streetsTable } from "./locations";
import { usersTable } from "./users";

export const businessStatusEnum = pgEnum("business_status", ["pending", "approved", "rejected", "suspended"]);
export const businessPlanEnum = pgEnum("business_plan", ["free", "premium"]);

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  streetId: integer("street_id").notNull().references(() => streetsTable.id),
  address: text("address"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  website: text("website"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  openingHours: text("opening_hours"),
  status: businessStatusEnum("status").notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  plan: businessPlanEnum("plan").notNull().default("free"),
  ownerId: integer("owner_id").references(() => usersTable.id),
  agentId: integer("agent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessPhotosTable = pgTable("business_photos", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ id: true, createdAt: true, status: true, verified: true, featured: true, plan: true });
export const insertBusinessPhotoSchema = createInsertSchema(businessPhotosTable).omit({ id: true, createdAt: true });

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
export type BusinessPhoto = typeof businessPhotosTable.$inferSelect;

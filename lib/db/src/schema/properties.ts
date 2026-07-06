import { pgTable, serial, integer, text, boolean, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { streetsTable } from "./locations";
import { usersTable } from "./users";

export const propertyStatusEnum = pgEnum("property_status", ["pending", "approved", "rejected"]);
export const propertyPriceTypeEnum = pgEnum("property_price_type", ["rent", "lease", "sale"]);

export const vacantPropertiesTable = pgTable("vacant_properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  streetId: integer("street_id").references(() => streetsTable.id),
  latitude: real("latitude"),
  longitude: real("longitude"),
  sizeSqft: real("size_sqft"),
  priceAmount: real("price_amount"),
  priceType: propertyPriceTypeEnum("price_type").notNull().default("rent"),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  submittedByUserId: integer("submitted_by_user_id").references(() => usersTable.id),
  status: propertyStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const propertyPhotosTable = pgTable("property_photos", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => vacantPropertiesTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertySchema = createInsertSchema(vacantPropertiesTable).omit({ id: true, createdAt: true, status: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type VacantProperty = typeof vacantPropertiesTable.$inferSelect;
export type PropertyPhoto = typeof propertyPhotosTable.$inferSelect;

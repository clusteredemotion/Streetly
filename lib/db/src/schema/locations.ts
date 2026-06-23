import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const citiesTable = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("Nigeria"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const areasTable = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cityId: integer("city_id").notNull().references(() => citiesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const streetsTable = pgTable("streets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  areaId: integer("area_id").notNull().references(() => areasTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true, createdAt: true });
export const insertAreaSchema = createInsertSchema(areasTable).omit({ id: true, createdAt: true });
export const insertStreetSchema = createInsertSchema(streetsTable).omit({ id: true, createdAt: true });

export type City = typeof citiesTable.$inferSelect;
export type Area = typeof areasTable.$inferSelect;
export type Street = typeof streetsTable.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type InsertStreet = z.infer<typeof insertStreetSchema>;

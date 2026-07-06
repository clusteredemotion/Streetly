import { pgTable, serial, integer, text, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const riderStatusEnum = pgEnum("rider_status", ["pending", "approved", "rejected", "suspended"]);

export const ridersTable = pgTable("riders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: riderStatusEnum("status").notNull().default("pending"),
  fullName: text("full_name"),
  phone: text("phone"),
  vehicleType: text("vehicle_type"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  passportObjectPath: text("passport_object_path"),
  ninSlipObjectPath: text("nin_slip_object_path"),
  isOnline: boolean("is_online").notNull().default(false),
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
  lastLocationAt: timestamp("last_location_at"),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRiderSchema = createInsertSchema(ridersTable).omit({
  id: true, createdAt: true, status: true, isOnline: true,
  currentLatitude: true, currentLongitude: true, lastLocationAt: true, totalDeliveries: true,
});

export type InsertRider = z.infer<typeof insertRiderSchema>;
export type Rider = typeof ridersTable.$inferSelect;

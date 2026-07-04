import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { businessesTable } from "./businesses";
import { ridersTable } from "./riders";

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "requested", "accepted", "picked_up", "delivered", "cancelled",
]);

export const deliveryOrdersTable = pgTable("delivery_orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  customerUserId: integer("customer_user_id").references(() => usersTable.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: real("delivery_latitude"),
  deliveryLongitude: real("delivery_longitude"),
  notes: text("notes"),
  status: deliveryStatusEnum("status").notNull().default("requested"),
  riderId: integer("rider_id").references(() => ridersTable.id),
  itemsSubtotal: real("items_subtotal"),
  deliveryFee: real("delivery_fee"),
  totalAmount: real("total_amount"),
  guestTrackingToken: text("guest_tracking_token"),
  guestTrackingTokenExpiresAt: timestamp("guest_tracking_token_expires_at"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeliveryOrderSchema = createInsertSchema(deliveryOrdersTable).omit({
  id: true, createdAt: true, requestedAt: true, acceptedAt: true, pickedUpAt: true,
  deliveredAt: true, cancelledAt: true, status: true, riderId: true,
  itemsSubtotal: true, deliveryFee: true, totalAmount: true,
});

export type InsertDeliveryOrder = z.infer<typeof insertDeliveryOrderSchema>;
export type DeliveryOrder = typeof deliveryOrdersTable.$inferSelect;

import { pgTable, serial, text, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { deliveryOrdersTable } from "./deliveries";

export const marketplaceItemsTable = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveryOrderItemsTable = pgTable("delivery_order_items", {
  id: serial("id").primaryKey(),
  deliveryOrderId: integer("delivery_order_id").notNull().references(() => deliveryOrdersTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => marketplaceItemsTable.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItemsTable).omit({
  id: true, createdAt: true, isAvailable: true,
});

export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItemsTable.$inferSelect;
export type DeliveryOrderItem = typeof deliveryOrderItemsTable.$inferSelect;

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { businessesTable } from "./businesses";
import { deliveryOrdersTable } from "./deliveries";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  businessId: integer("business_id").references(() => businessesTable.id, { onDelete: "cascade" }),
  riderId: integer("rider_id").references(() => usersTable.id, { onDelete: "cascade" }),
  deliveryId: integer("delivery_id").references(() => deliveryOrdersTable.id, { onDelete: "set null" }),
  subject: text("subject"),
  status: text("status").notNull().default("connecting"),
  assignedTo: text("assigned_to").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Conversation = typeof conversationsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;

import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => usersTable.id, { onDelete: "set null" }),
  recipientType: text("recipient_type").notNull().default("all"),
  recipientId: integer("recipient_id").references(() => usersTable.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type Message = typeof messagesTable.$inferSelect;

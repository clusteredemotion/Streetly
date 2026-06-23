import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { usersTable } from "./users";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id),
  reviewerName: text("reviewer_name").notNull().default("Anonymous"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;

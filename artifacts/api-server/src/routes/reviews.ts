import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router({ mergeParams: true });

// GET /businesses/:businessId/reviews
router.get("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.businessId, businessId))
    .orderBy(desc(reviewsTable.createdAt));

  return res.json(reviews);
});

// POST /businesses/:businessId/reviews
router.post("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const { reviewerName, rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  const [review] = await db.insert(reviewsTable).values({
    businessId,
    reviewerName: reviewerName ?? "Anonymous",
    rating: Number(rating),
    comment,
  }).returning();

  return res.status(201).json(review);
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable, businessPhotosTable, categoriesTable, streetsTable, areasTable, citiesTable, reviewsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// GET /streets/:streetId/businesses
router.get("/:streetId/businesses", async (req, res) => {
  const streetId = parseInt(req.params.streetId);
  if (isNaN(streetId)) return res.status(400).json({ error: "Invalid streetId" });

  const businesses = await db.select().from(businessesTable)
    .where(and(eq(businessesTable.streetId, streetId), eq(businessesTable.status, "approved")));

  const enriched = await Promise.all(businesses.map(async (biz) => {
    const photos = await db.select().from(businessPhotosTable).where(eq(businessPhotosTable.businessId, biz.id));
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, biz.categoryId)).limit(1);
    const [ratingRow] = await db
      .select({ avg: sql<number>`avg(rating)`, cnt: sql<number>`count(*)` })
      .from(reviewsTable).where(eq(reviewsTable.businessId, biz.id));

    return {
      ...biz,
      categoryName: cat?.name ?? null,
      streetName: null,
      areaName: null,
      cityName: null,
      rating: ratingRow.avg ? Number(ratingRow.avg.toFixed(1)) : null,
      reviewCount: Number(ratingRow.cnt ?? 0),
      photos: photos.map(p => ({ id: p.id, url: p.url, caption: p.caption })),
    };
  }));

  return res.json(enriched);
});

export default router;

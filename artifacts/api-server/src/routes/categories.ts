import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, businessesTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

// GET /categories
router.get("/", async (_req, res) => {
  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      icon: categoriesTable.icon,
      businessCount: sql<number>`(select count(*) from businesses where businesses.category_id = categories.id and businesses.status = 'approved')`.as("businessCount"),
    })
    .from(categoriesTable)
    .orderBy(categoriesTable.name);

  return res.json(categories);
});

export default router;

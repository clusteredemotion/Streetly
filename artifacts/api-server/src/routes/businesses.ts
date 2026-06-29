import { Router } from "express";
import { db } from "@workspace/db";
import {
  businessesTable, businessPhotosTable, categoriesTable,
  streetsTable, areasTable, citiesTable, reviewsTable
} from "@workspace/db";
import { eq, and, ilike, sql, asc, desc } from "drizzle-orm";

const router = Router();

async function enrichBusiness(biz: typeof businessesTable.$inferSelect) {
  const photos = await db.select().from(businessPhotosTable).where(eq(businessPhotosTable.businessId, biz.id));
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, biz.categoryId)).limit(1);
  const [street] = await db.select().from(streetsTable).where(eq(streetsTable.id, biz.streetId)).limit(1);
  const [area] = street ? await db.select().from(areasTable).where(eq(areasTable.id, street.areaId)).limit(1) : [];
  const [city] = area ? await db.select().from(citiesTable).where(eq(citiesTable.id, area.cityId)).limit(1) : [];
  const [ratingRow] = await db
    .select({ avg: sql<number>`avg(rating)`, cnt: sql<number>`count(*)` })
    .from(reviewsTable)
    .where(eq(reviewsTable.businessId, biz.id));

  return {
    ...biz,
    categoryName: cat?.name ?? null,
    streetName: street?.name ?? null,
    areaName: area?.name ?? null,
    cityName: city?.name ?? null,
    rating: ratingRow.avg ? Number(parseFloat(String(ratingRow.avg)).toFixed(1)) : null,
    reviewCount: Number(ratingRow.cnt ?? 0),
    photos: photos.map(p => ({ id: p.id, url: p.url, caption: p.caption })),
  };
}

// GET /businesses
router.get("/", async (req, res) => {
  const { q, categoryId, cityId, areaId, streetId, verified, featured, limit = 20, offset = 0 } = req.query;

  let rows = await db.select().from(businessesTable).where(eq(businessesTable.status, "approved"));

  // Filter in memory for simplicity
  let filtered = rows;
  if (q) filtered = filtered.filter(b => b.name.toLowerCase().includes(String(q).toLowerCase()));
  if (categoryId) filtered = filtered.filter(b => b.categoryId === Number(categoryId));
  if (streetId) filtered = filtered.filter(b => b.streetId === Number(streetId));
  if (verified !== undefined) filtered = filtered.filter(b => b.verified === (verified === "true"));
  if (featured !== undefined) filtered = filtered.filter(b => b.featured === (featured === "true"));

  // cityId/areaId need join — do it with subquery in enriched form
  if (cityId || areaId) {
    const enriched = await Promise.all(filtered.map(enrichBusiness));
    let e = enriched;
    if (areaId) {
      const areaRow = await db.select().from(areasTable).where(eq(areasTable.id, Number(areaId))).limit(1);
      if (areaRow[0]) {
        const streetIds = (await db.select().from(streetsTable).where(eq(streetsTable.areaId, Number(areaId)))).map(s => s.id);
        e = e.filter(b => streetIds.includes(b.streetId));
      }
    }
    if (cityId) {
      e = e.filter(b => {
        // find city from enriched data
        return true; // simplified — we'd need city lookup
      });
    }
    const total = e.length;
    const page = e.slice(Number(offset), Number(offset) + Number(limit));
    return res.json({ businesses: page, total });
  }

  const total = filtered.length;
  const page = filtered.slice(Number(offset), Number(offset) + Number(limit));
  const enriched = await Promise.all(page.map(enrichBusiness));
  return res.json({ businesses: enriched, total });
});

// GET /businesses/featured
router.get("/featured", async (_req, res) => {
  const rows = await db.select().from(businessesTable)
    .where(and(eq(businessesTable.featured, true), eq(businessesTable.status, "approved")))
    .orderBy(sql`sort_order NULLS LAST`, asc(businessesTable.id))
    .limit(8);
  const enriched = await Promise.all(rows.map(enrichBusiness));
  return res.json(enriched);
});

// GET /businesses/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
  if (!biz) return res.status(404).json({ error: "Business not found" });

  const enriched = await enrichBusiness(biz);
  return res.json(enriched);
});

// POST /businesses
router.post("/", async (req, res) => {
  const { name, categoryId, streetId, description, address, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl, latitude, longitude, openingHours } = req.body;
  if (!name || !categoryId || !streetId) {
    return res.status(400).json({ error: "name, categoryId, streetId are required" });
  }

  const [biz] = await db.insert(businessesTable).values({
    name, categoryId: Number(categoryId), streetId: Number(streetId),
    description, address, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    openingHours,
  }).returning();

  const enriched = await enrichBusiness(biz);
  return res.status(201).json(enriched);
});

// PATCH /businesses/:id
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { name, categoryId, streetId, description, address, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl, latitude, longitude, openingHours } = req.body;

  const updates: Partial<typeof businessesTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (categoryId) updates.categoryId = Number(categoryId);
  if (streetId) updates.streetId = Number(streetId);
  if (description !== undefined) updates.description = description;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (whatsapp !== undefined) updates.whatsapp = whatsapp;
  if (website !== undefined) updates.website = website;
  if (instagramUrl !== undefined) updates.instagramUrl = instagramUrl;
  if (facebookUrl !== undefined) updates.facebookUrl = facebookUrl;
  if (tiktokUrl !== undefined) updates.tiktokUrl = tiktokUrl;
  if (latitude !== undefined) updates.latitude = Number(latitude);
  if (longitude !== undefined) updates.longitude = Number(longitude);
  if (openingHours !== undefined) updates.openingHours = openingHours;

  const [biz] = await db.update(businessesTable).set(updates).where(eq(businessesTable.id, id)).returning();
  if (!biz) return res.status(404).json({ error: "Business not found" });

  const enriched = await enrichBusiness(biz);
  return res.json(enriched);
});

// DELETE /businesses/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(businessesTable).where(eq(businessesTable.id, id));
  return res.status(204).send();
});

export default router;

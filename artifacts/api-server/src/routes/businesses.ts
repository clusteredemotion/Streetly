import { Router } from "express";
import { db } from "@workspace/db";
import {
  businessesTable, businessPhotosTable, categoriesTable,
  streetsTable, areasTable, citiesTable, reviewsTable, marketplaceItemsTable
} from "@workspace/db";
import { eq, and, ilike, sql, asc, desc } from "drizzle-orm";
import { requireAuth } from "../lib/authHelpers";

const router = Router();

/* ── Slug helpers ── */
function toBaseSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^-|-$/g, "") || "business";
}

async function generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = toBaseSlug(name);
  let slug = base;
  let n = 2;
  while (true) {
    const rows = await db.select({ id: businessesTable.id }).from(businessesTable)
      .where(eq(businessesTable.slug, slug)).limit(1);
    if (!rows.length || (excludeId !== undefined && rows[0].id === excludeId)) break;
    slug = base + n;
    n++;
  }
  return slug;
}

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
  const { q, categoryId, cityId, areaId, streetId, country, state, verified, featured, limit = 20, offset = 0 } = req.query;

  let rows = await db.select().from(businessesTable).where(eq(businessesTable.status, "approved"));

  let filtered = rows;
  if (q) filtered = filtered.filter(b => b.name.toLowerCase().includes(String(q).toLowerCase()));
  if (categoryId) filtered = filtered.filter(b => b.categoryId === Number(categoryId));
  if (streetId) filtered = filtered.filter(b => b.streetId === Number(streetId));
  if (verified !== undefined) filtered = filtered.filter(b => b.verified === (verified === "true"));
  if (featured !== undefined) filtered = filtered.filter(b => b.featured === (featured === "true"));

  if (cityId || areaId || country || state) {
    const locRows = await db.select({
      streetId: streetsTable.id,
      areaId: areasTable.id,
      cityId: citiesTable.id,
      country: citiesTable.country,
      state: citiesTable.state,
    }).from(streetsTable)
      .innerJoin(areasTable, eq(streetsTable.areaId, areasTable.id))
      .innerJoin(citiesTable, eq(areasTable.cityId, citiesTable.id));
    const locMap = new Map(locRows.map(r => [r.streetId, r]));

    filtered = filtered.filter(b => {
      const loc = locMap.get(b.streetId);
      if (!loc) return false;
      if (areaId && loc.areaId !== Number(areaId)) return false;
      if (cityId && loc.cityId !== Number(cityId)) return false;
      if (country && loc.country !== country) return false;
      if (state && loc.state !== state) return false;
      return true;
    });
  }

  const total = filtered.length;
  const page = filtered.slice(Number(offset), Number(offset) + Number(limit));
  const enriched = await Promise.all(page.map(enrichBusiness));
  return res.json({ businesses: enriched, total });
});

// GET /businesses/mine — businesses owned by the current authenticated user (any status)
router.get("/mine", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const rows = await db.select().from(businessesTable).where(eq(businessesTable.ownerId, user.id));
  const enriched = await Promise.all(rows.map(enrichBusiness));
  return res.json(enriched);
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

// GET /businesses/:id/photos
router.get("/:id/photos", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const photos = await db.select().from(businessPhotosTable).where(eq(businessPhotosTable.businessId, id));
  return res.json(photos);
});

// POST /businesses/:id/photos — add photo (owner)
router.post("/:id/photos", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { url, caption } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  const [photo] = await db.insert(businessPhotosTable).values({ businessId: id, url, caption: caption ?? null }).returning();
  return res.status(201).json(photo);
});

// DELETE /businesses/:id/photos/:photoId
router.delete("/:id/photos/:photoId", async (req, res) => {
  const photoId = parseInt(req.params.photoId);
  if (isNaN(photoId)) return res.status(400).json({ error: "Invalid photoId" });
  await db.delete(businessPhotosTable).where(eq(businessPhotosTable.id, photoId));
  return res.json({ ok: true });
});

// GET /businesses/:idOrSlug — accepts numeric id OR slug string
router.get("/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const numId = parseInt(idOrSlug);
  const isNumeric = !isNaN(numId) && String(numId) === idOrSlug;

  const [biz] = isNumeric
    ? await db.select().from(businessesTable).where(eq(businessesTable.id, numId)).limit(1)
    : await db.select().from(businessesTable).where(eq(businessesTable.slug, idOrSlug)).limit(1);

  if (!biz) return res.status(404).json({ error: "Business not found" });
  const enriched = await enrichBusiness(biz);
  return res.json(enriched);
});

// POST /businesses
router.post("/", async (req, res) => {
  const { name, categoryId, streetId, description, address, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl, youtubeUrl, latitude, longitude, openingHours } = req.body;
  if (!name || !categoryId || !streetId) {
    return res.status(400).json({ error: "name, categoryId, streetId are required" });
  }

  const slug = await generateUniqueSlug(name);

  const [biz] = await db.insert(businessesTable).values({
    name, slug, categoryId: Number(categoryId), streetId: Number(streetId),
    description, address, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl, youtubeUrl,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    openingHours,
  }).returning();

  const enriched = await enrichBusiness(biz);
  return res.status(201).json(enriched);
});

// POST /businesses/self-register — a logged-in business owner lists their own business
router.post("/self-register", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  if (user.role !== "business_owner") {
    return res.status(403).json({ error: "Only business owner accounts can self-register a business" });
  }

  const {
    name, description, categoryId,
    stateName, cityName, areaName, streetName,
    address, phone, whatsapp, website, instagramUrl, facebookUrl, tiktokUrl, youtubeUrl,
    latitude, longitude, openingHours,
    photos = [],
    products = [],
  } = req.body;

  if (!name || !categoryId || !cityName || !areaName || !streetName) {
    return res.status(400).json({ error: "name, categoryId, cityName, areaName, streetName are required" });
  }

  let cityRows = await db.select().from(citiesTable)
    .where(and(ilike(citiesTable.name, cityName), ilike(citiesTable.state, stateName || "%")))
    .limit(1);
  let city = cityRows[0];
  if (!city) {
    const inserted = await db.insert(citiesTable).values({ name: cityName, state: stateName || "Unknown", country: "Nigeria" }).returning();
    city = inserted[0];
  }

  let areaRows = await db.select().from(areasTable).where(and(ilike(areasTable.name, areaName), eq(areasTable.cityId, city.id))).limit(1);
  let area = areaRows[0];
  if (!area) {
    const inserted = await db.insert(areasTable).values({ name: areaName, cityId: city.id }).returning();
    area = inserted[0];
  }

  let streetRows = await db.select().from(streetsTable).where(and(ilike(streetsTable.name, streetName), eq(streetsTable.areaId, area.id))).limit(1);
  let street = streetRows[0];
  if (!street) {
    const inserted = await db.insert(streetsTable).values({ name: streetName, areaId: area.id }).returning();
    street = inserted[0];
  }

  const slug = await generateUniqueSlug(name);

  const [biz] = await db.insert(businessesTable).values({
    name,
    slug,
    description: description || null,
    categoryId: Number(categoryId),
    streetId: street.id,
    address: address || null,
    phone: phone || null,
    whatsapp: whatsapp || null,
    website: website || null,
    instagramUrl: instagramUrl || null,
    facebookUrl: facebookUrl || null,
    tiktokUrl: tiktokUrl || null,
    youtubeUrl: youtubeUrl || null,
    latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
    longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
    openingHours: openingHours || null,
    status: "pending",
    verified: false,
    featured: false,
    ownerId: user.id,
  }).returning();

  if (Array.isArray(photos) && photos.length > 0) {
    await db.insert(businessPhotosTable).values(
      photos.slice(0, 10).map((p: { url: string; caption?: string }) => ({
        businessId: biz.id, url: p.url, caption: p.caption ?? null,
      }))
    );
  }

  if (Array.isArray(products) && products.length > 0) {
    const validProducts = products.filter(
      (p: { name?: string; price?: number | string }) =>
        p && typeof p.name === "string" && p.name.trim().length > 0 &&
        p.price !== undefined && p.price !== null && !isNaN(Number(p.price)) && Number(p.price) >= 0
    );
    if (validProducts.length > 0) {
      await db.insert(marketplaceItemsTable).values(
        validProducts.map((p: { name: string; description?: string; price: number | string; imageUrl?: string }) => ({
          businessId: biz.id,
          name: p.name.trim(),
          description: p.description?.trim() || null,
          price: Number(p.price),
          imageUrl: p.imageUrl || null,
        }))
      );
    }
  }

  return res.status(201).json({ ...biz, streetName: street.name, areaName: area.name, cityName: city.name });
});

// PATCH /businesses/:id
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [biz] = await db.update(businessesTable)
    .set(req.body)
    .where(eq(businessesTable.id, id))
    .returning();
  if (!biz) return res.status(404).json({ error: "Business not found" });
  return res.json(biz);
});

export default router;
export { generateUniqueSlug, toBaseSlug };

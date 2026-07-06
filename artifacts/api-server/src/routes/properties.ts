import { Router } from "express";
import { db } from "@workspace/db";
import {
  vacantPropertiesTable, propertyPhotosTable, streetsTable, areasTable, citiesTable,
} from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/authHelpers";

const router = Router();

export async function enrichProperty(prop: typeof vacantPropertiesTable.$inferSelect) {
  const photos = await db.select().from(propertyPhotosTable).where(eq(propertyPhotosTable.propertyId, prop.id));
  const [street] = prop.streetId ? await db.select().from(streetsTable).where(eq(streetsTable.id, prop.streetId)).limit(1) : [];
  const [area] = street ? await db.select().from(areasTable).where(eq(areasTable.id, street.areaId)).limit(1) : [];
  const [city] = area ? await db.select().from(citiesTable).where(eq(citiesTable.id, area.cityId)).limit(1) : [];
  return {
    ...prop,
    streetName: street?.name ?? null,
    areaName: area?.name ?? null,
    cityName: city?.name ?? null,
    photos: photos.map(p => ({ id: p.id, url: p.url })),
  };
}

// GET /properties — public, approved only, with filters
router.get("/", async (req, res) => {
  const { priceType, minSize, maxPrice, streetId, areaId, cityId, country, state } = req.query;
  const conditions = [eq(vacantPropertiesTable.status, "approved")];
  if (priceType) conditions.push(eq(vacantPropertiesTable.priceType, priceType as "rent" | "lease" | "sale"));
  if (streetId) conditions.push(eq(vacantPropertiesTable.streetId, Number(streetId)));
  if (minSize) conditions.push(gte(vacantPropertiesTable.sizeSqft, Number(minSize)));
  if (maxPrice) conditions.push(lte(vacantPropertiesTable.priceAmount, Number(maxPrice)));

  let rows = await db.select().from(vacantPropertiesTable).where(and(...conditions)).orderBy(desc(vacantPropertiesTable.createdAt));

  if (areaId || cityId || country || state) {
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

    rows = rows.filter(p => {
      const loc = p.streetId ? locMap.get(p.streetId) : undefined;
      if (!loc) return false;
      if (areaId && loc.areaId !== Number(areaId)) return false;
      if (cityId && loc.cityId !== Number(cityId)) return false;
      if (country && loc.country !== country) return false;
      if (state && loc.state !== state) return false;
      return true;
    });
  }

  const enriched = await Promise.all(rows.map(enrichProperty));
  return res.json(enriched);
});

// GET /properties/mine — properties I submitted
router.get("/mine", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const rows = await db.select().from(vacantPropertiesTable)
    .where(eq(vacantPropertiesTable.submittedByUserId, user.id))
    .orderBy(desc(vacantPropertiesTable.createdAt));
  const enriched = await Promise.all(rows.map(enrichProperty));
  return res.json(enriched);
});

// GET /properties/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [prop] = await db.select().from(vacantPropertiesTable).where(eq(vacantPropertiesTable.id, id)).limit(1);
  if (!prop) return res.status(404).json({ error: "Property not found" });
  const enriched = await enrichProperty(prop);
  return res.json(enriched);
});

// POST /properties — submit a vacant property (pending review)
router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const {
    title, description, address, streetId, latitude, longitude,
    sizeSqft, priceAmount, priceType, contactName, contactPhone, photos = [],
  } = req.body;

  if (!title || !address || !contactName || !contactPhone) {
    return res.status(400).json({ error: "title, address, contactName, contactPhone are required" });
  }

  const [prop] = await db.insert(vacantPropertiesTable).values({
    title,
    description: description || null,
    address,
    streetId: streetId ? Number(streetId) : null,
    latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : undefined,
    longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : undefined,
    sizeSqft: sizeSqft !== undefined && sizeSqft !== "" ? Number(sizeSqft) : undefined,
    priceAmount: priceAmount !== undefined && priceAmount !== "" ? Number(priceAmount) : undefined,
    priceType: priceType || "rent",
    contactName,
    contactPhone,
    submittedByUserId: user.id,
    status: "pending",
  }).returning();

  if (Array.isArray(photos) && photos.length > 0) {
    await db.insert(propertyPhotosTable).values(
      photos.slice(0, 10).map((url: string) => ({ propertyId: prop.id, url }))
    );
  }

  const enriched = await enrichProperty(prop);
  return res.status(201).json(enriched);
});

export default router;

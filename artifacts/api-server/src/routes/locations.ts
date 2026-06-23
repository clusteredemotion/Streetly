import { Router } from "express";
import { db } from "@workspace/db";
import { citiesTable, areasTable, streetsTable, businessesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /cities
router.get("/cities", async (_req, res) => {
  const cities = await db
    .select({
      id: citiesTable.id,
      name: citiesTable.name,
      state: citiesTable.state,
      country: citiesTable.country,
      businessCount: sql<number>`(select count(*) from businesses b join streets s on b.street_id = s.id join areas a on s.area_id = a.id where a.city_id = cities.id and b.status = 'approved')`.as("businessCount"),
    })
    .from(citiesTable)
    .orderBy(citiesTable.name);

  return res.json(cities);
});

// GET /cities/:cityId/areas
router.get("/cities/:cityId/areas", async (req, res) => {
  const cityId = parseInt(req.params.cityId);
  if (isNaN(cityId)) return res.status(400).json({ error: "Invalid cityId" });

  const areas = await db
    .select({
      id: areasTable.id,
      name: areasTable.name,
      cityId: areasTable.cityId,
      businessCount: sql<number>`(select count(*) from businesses b join streets s on b.street_id = s.id where s.area_id = areas.id and b.status = 'approved')`.as("businessCount"),
    })
    .from(areasTable)
    .where(eq(areasTable.cityId, cityId))
    .orderBy(areasTable.name);

  return res.json(areas);
});

// GET /areas/:areaId/streets
router.get("/areas/:areaId/streets", async (req, res) => {
  const areaId = parseInt(req.params.areaId);
  if (isNaN(areaId)) return res.status(400).json({ error: "Invalid areaId" });

  const streets = await db
    .select({
      id: streetsTable.id,
      name: streetsTable.name,
      areaId: streetsTable.areaId,
      businessCount: sql<number>`(select count(*) from businesses where businesses.street_id = streets.id and businesses.status = 'approved')`.as("businessCount"),
    })
    .from(streetsTable)
    .where(eq(streetsTable.areaId, areaId))
    .orderBy(streetsTable.name);

  return res.json(streets);
});

export default router;

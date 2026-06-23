import { Router } from "express";
import { db } from "@workspace/db";
import { businessesTable, citiesTable, streetsTable, agentsTable, withdrawalsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";

const router = Router();

// GET /stats
router.get("/", async (_req, res) => {
  const [bizCount] = await db.select({ count: count() }).from(businessesTable).where(eq(businessesTable.status, "approved"));
  const [streetCount] = await db.select({ count: count() }).from(streetsTable);
  const [cityCount] = await db.select({ count: count() }).from(citiesTable);
  const [agentCount] = await db.select({ count: count() }).from(agentsTable).where(eq(agentsTable.status, "approved"));
  const [verifiedCount] = await db.select({ count: count() }).from(businessesTable).where(eq(businessesTable.verified, true));
  const [earningsPaid] = await db.select({ total: sum(withdrawalsTable.amount) }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "completed"));

  return res.json({
    totalBusinesses: bizCount.count,
    totalStreets: streetCount.count,
    totalCities: cityCount.count,
    totalAgents: agentCount.count,
    verifiedBusinesses: verifiedCount.count,
    totalEarningsPaid: Number(earningsPaid.total ?? 0),
  });
});

export default router;

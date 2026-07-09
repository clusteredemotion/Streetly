import { Router, Request } from "express";
import { db } from "@workspace/db";
import {
  businessAnalyticsEventsTable, businessesTable, deliveryOrdersTable,
} from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/authHelpers";

type BusinessParams = { businessId: string };

const router = Router({ mergeParams: true });

const VALID_EVENT_TYPES = ["view", "click", "contact", "order"] as const;

// POST /analytics/track — public, fire-and-forget from the frontend
router.post("/track", async (req, res) => {
  const { businessId, eventType, meta } = req.body;
  const id = parseInt(businessId);
  if (isNaN(id) || !VALID_EVENT_TYPES.includes(eventType)) {
    return res.status(400).json({ error: "Valid businessId and eventType are required" });
  }
  try {
    await db.insert(businessAnalyticsEventsTable).values({
      businessId: id,
      eventType,
      meta: meta ? String(meta).slice(0, 500) : null,
    });
  } catch {
    // non-fatal: analytics should never break the user flow
  }
  return res.status(202).json({ ok: true });
});

// GET /businesses/:businessId/analytics — owner or admin only
router.get("/", requireAuth, async (req: Request<BusinessParams>, res) => {
  const businessId = parseInt(req.params.businessId);
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid businessId" });

  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!biz) return res.status(404).json({ error: "Business not found" });

  const user = (req as any).currentUser;
  if (user.role !== "admin" && biz.ownerId !== user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const totals = await db
    .select({ eventType: businessAnalyticsEventsTable.eventType, count: sql<number>`count(*)` })
    .from(businessAnalyticsEventsTable)
    .where(eq(businessAnalyticsEventsTable.businessId, businessId))
    .groupBy(businessAnalyticsEventsTable.eventType);

  const daily = await db
    .select({
      day: sql<string>`to_char(${businessAnalyticsEventsTable.createdAt}, 'YYYY-MM-DD')`,
      eventType: businessAnalyticsEventsTable.eventType,
      count: sql<number>`count(*)`,
    })
    .from(businessAnalyticsEventsTable)
    .where(and(eq(businessAnalyticsEventsTable.businessId, businessId), gte(businessAnalyticsEventsTable.createdAt, since)))
    .groupBy(sql`to_char(${businessAnalyticsEventsTable.createdAt}, 'YYYY-MM-DD')`, businessAnalyticsEventsTable.eventType)
    .orderBy(sql`to_char(${businessAnalyticsEventsTable.createdAt}, 'YYYY-MM-DD')`);

  const [orderStats] = await db
    .select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${deliveryOrdersTable.totalAmount}), 0)` })
    .from(deliveryOrdersTable)
    .where(eq(deliveryOrdersTable.businessId, businessId));

  const totalsMap: Record<string, number> = { view: 0, click: 0, contact: 0, order: 0 };
  for (const t of totals) totalsMap[t.eventType] = Number(t.count);

  return res.json({
    totals: totalsMap,
    orders: { count: Number(orderStats?.count ?? 0), revenue: Number(orderStats?.revenue ?? 0) },
    daily: daily.map(d => ({ day: d.day, eventType: d.eventType, count: Number(d.count) })),
  });
});

export default router;

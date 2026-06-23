import { Router } from "express";
import { db } from "@workspace/db";
import { businessClaimsTable, businessesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "./auth";

const router = Router({ mergeParams: true });

function getUser(req: any): { userId: number } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

// POST /businesses/:id/claim
router.post("/", async (req, res) => {
  const businessId = parseInt(req.params.businessId ?? req.params.id ?? "0");
  if (isNaN(businessId)) return res.status(400).json({ error: "Invalid business id" });

  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Please log in to claim a business" });

  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!business) return res.status(404).json({ error: "Business not found" });
  if (business.ownerId) return res.status(400).json({ error: "This business already has a verified owner" });

  // Check no pending claim from this user
  const [existing] = await db
    .select()
    .from(businessClaimsTable)
    .where(and(eq(businessClaimsTable.businessId, businessId), eq(businessClaimsTable.userId, user.userId), eq(businessClaimsTable.status, "pending")))
    .limit(1);
  if (existing) return res.status(400).json({ error: "You already have a pending claim for this business" });

  const { claimerName, claimerEmail, claimerPhone, proofNote } = req.body;
  if (!claimerName || !claimerEmail) return res.status(400).json({ error: "Name and email are required" });

  const [claim] = await db.insert(businessClaimsTable).values({
    businessId, userId: user.userId,
    claimerName, claimerEmail, claimerPhone, proofNote,
  }).returning();

  return res.status(201).json(claim);
});

// GET /businesses/:id/claim/status — check claim status for current user
router.get("/status", async (req, res) => {
  const businessId = parseInt(req.params.businessId ?? req.params.id ?? "0");
  const user = getUser(req);
  if (!user) return res.json({ claimed: false, status: null });

  const [claim] = await db
    .select()
    .from(businessClaimsTable)
    .where(and(eq(businessClaimsTable.businessId, businessId), eq(businessClaimsTable.userId, user.userId)))
    .limit(1);

  return res.json({ claimed: !!claim, status: claim?.status ?? null, claimId: claim?.id ?? null });
});

export default router;

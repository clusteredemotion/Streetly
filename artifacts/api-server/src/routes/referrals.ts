import { Router } from "express";
import { db } from "@workspace/db";
import { referralsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/authHelpers";

const router = Router();

// GET /users/me/referrals
router.get("/me/referrals", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

  const history = await db
    .select({
      id: referralsTable.id,
      pointsAwarded: referralsTable.pointsAwarded,
      reason: referralsTable.reason,
      createdAt: referralsTable.createdAt,
      refereeName: usersTable.name,
      refereeEmail: usersTable.email,
    })
    .from(referralsTable)
    .leftJoin(usersTable, eq(referralsTable.refereeId, usersTable.id))
    .where(eq(referralsTable.referrerId, user.id))
    .orderBy(desc(referralsTable.createdAt));

  return res.json({
    referralCode: user.referralCode,
    creditPoints: user.creditPoints,
    totalReferrals: history.length,
    history,
  });
});

export default router;

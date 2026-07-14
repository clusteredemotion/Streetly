import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/public/settings", async (_req, res) => {
  try {
    const rows = await db.execute(
      sql`SELECT key, value FROM settings WHERE key = 'default_map_style'`
    );
    const out: Record<string, string> = { default_map_style: "positron" };
    for (const row of rows.rows as { key: string; value: string | null }[]) {
      if (row.value) out[row.key] = row.value;
    }
    return res.json(out);
  } catch {
    return res.json({ default_map_style: "explore" });
  }
});

export default router;

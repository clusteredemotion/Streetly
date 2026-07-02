import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { businessesTable } from "@workspace/db";
import { isNull, eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

function toBaseSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^-|-$/g, "") || "business";
}

async function backfillSlugs() {
  try {
    const missing = await db.select({ id: businessesTable.id, name: businessesTable.name })
      .from(businessesTable)
      .where(isNull(businessesTable.slug));

    if (!missing.length) {
      logger.info("Slug backfill: all businesses already have slugs");
      return;
    }

    logger.info({ count: missing.length }, "Slug backfill: filling missing slugs");

    for (const biz of missing) {
      const base = toBaseSlug(biz.name);
      let slug = base;
      let n = 2;
      while (true) {
        const conflict = await db.select({ id: businessesTable.id }).from(businessesTable)
          .where(eq(businessesTable.slug, slug)).limit(1);
        if (!conflict.length || conflict[0].id === biz.id) break;
        slug = base + n++;
      }
      await db.update(businessesTable).set({ slug }).where(eq(businessesTable.id, biz.id));
      logger.info({ id: biz.id, name: biz.name, slug }, "Slug backfill: set slug");
    }

    logger.info("Slug backfill: complete");
  } catch (err) {
    logger.error({ err }, "Slug backfill: failed (non-fatal)");
  }
}

async function start() {
  await backfillSlugs();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();

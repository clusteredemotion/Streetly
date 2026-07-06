import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { businessesTable, usersTable } from "@workspace/db";
import { isNull, eq, sql } from "drizzle-orm";
import crypto from "crypto";

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

async function ensureAdminUser() {
  try {
    const existingAdmin = await db.execute(sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (existingAdmin.rows.length > 0) {
      // An admin account already exists — never overwrite its credentials on restart,
      // otherwise any password/email the admin set via Settings would be silently reverted.
      logger.info("Admin user already exists; skipping seed");
      return;
    }
    const email = "admin@mystreetly.app";
    const hash = crypto.createHash("sha256").update("Melavies1537@" + "streetly_salt").digest("hex");
    await db.execute(
      sql`INSERT INTO users (name, email, password_hash, role, created_at)
          VALUES ('Admin', ${email}, ${hash}, 'admin', NOW())
          ON CONFLICT (email) DO UPDATE SET role = 'admin'`
    );
    logger.info("Admin user ensured");
  } catch (err) {
    logger.error({ err }, "ensureAdminUser: failed (non-fatal)");
  }
}

async function start() {
  await backfillSlugs();
  await ensureAdminUser();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();

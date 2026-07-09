import { getTableColumns, getTableName } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../src/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function isTable(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "_" in (value as object);
}

async function main() {
  const client = await pool.connect();
  let hasDrift = false;

  try {
    const { rows } = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`
    );

    const dbColumnsByTable = new Map<string, Set<string>>();
    for (const row of rows) {
      if (!dbColumnsByTable.has(row.table_name)) {
        dbColumnsByTable.set(row.table_name, new Set());
      }
      dbColumnsByTable.get(row.table_name)!.add(row.column_name);
    }

    const { rows: tableRows } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const dbTableNames = new Set(tableRows.map((r) => r.table_name));

    for (const [exportName, exported] of Object.entries(schema)) {
      if (!isTable(exported)) continue;

      const tableName = getTableName(exported as never);
      if (!dbTableNames.has(tableName)) {
        hasDrift = true;
        console.error(`[MISSING TABLE] "${tableName}" (schema export: ${exportName}) exists in lib/db/src/schema but not in the database.`);
        continue;
      }

      const dbColumns = dbColumnsByTable.get(tableName) ?? new Set<string>();
      const expectedColumns = getTableColumns(exported as never);

      for (const [, column] of Object.entries(expectedColumns)) {
        const columnName = (column as { name: string }).name;
        if (!dbColumns.has(columnName)) {
          hasDrift = true;
          console.error(`[MISSING COLUMN] "${tableName}.${columnName}" is defined in lib/db/src/schema but missing from the database.`);
        }
      }
    }

    if (hasDrift) {
      console.error("\nSchema drift detected. Run `pnpm --filter @workspace/db run push` to sync the database with lib/db/src/schema.");
      process.exitCode = 1;
    } else {
      console.log("No schema drift detected: all tables/columns in lib/db/src/schema exist in the database.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("check-schema-drift failed:", err);
  process.exitCode = 1;
});

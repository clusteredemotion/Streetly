---
name: drizzle-kit push fails without TTY
description: drizzle-kit push/push-force errors "Interactive prompts require a TTY terminal" when run from the agent shell, even with --force.
---

`pnpm --filter @workspace/db run push` (drizzle-kit push) can throw "Interactive prompts require a TTY terminal" even with `push-force`, because drizzle-kit sometimes wants to confirm table identity (create vs. rename) interactively and the agent shell has no TTY.

**Why:** drizzle-kit's create/rename resolver uses an interactive prompt component that hard-checks `process.stdin.isTTY`; piping input does not satisfy it since it checks the TTY flag, not stdin content.

**How to apply:** When adding a brand-new table and the push fails this way, create the table directly with a `CREATE TABLE IF NOT EXISTS` SQL statement via `psql "$DATABASE_URL"` matching the Drizzle schema exactly (column names/types/defaults), instead of fighting drizzle-kit push. Do this before running api-spec codegen so downstream code can find the schema/table in place.

The same TTY failure also hits `ALTER TABLE ... ADD COLUMN` pushes for existing tables (not just new tables), and it can happen inside the automated post-merge setup script too — the merge changelog may claim the column was added via raw SQL, but if that step was skipped/missed the DB silently stays out of sync with `schema.ts` while everything typechecks fine. Symptom: routes touching that table crash at runtime with a generic "Failed query" error even though no code looks wrong. Always verify with `psql "$DATABASE_URL" -c '\d table_name'` that a newly-added column actually exists before trusting the schema file, especially right after a task merge — don't assume the changelog's raw-SQL step actually ran.

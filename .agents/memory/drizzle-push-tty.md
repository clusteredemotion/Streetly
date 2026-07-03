---
name: drizzle-kit push fails without TTY
description: drizzle-kit push/push-force errors "Interactive prompts require a TTY terminal" when run from the agent shell, even with --force.
---

`pnpm --filter @workspace/db run push` (drizzle-kit push) can throw "Interactive prompts require a TTY terminal" even with `push-force`, because drizzle-kit sometimes wants to confirm table identity (create vs. rename) interactively and the agent shell has no TTY.

**Why:** drizzle-kit's create/rename resolver uses an interactive prompt component that hard-checks `process.stdin.isTTY`; piping input does not satisfy it since it checks the TTY flag, not stdin content.

**How to apply:** When adding a brand-new table and the push fails this way, create the table directly with a `CREATE TABLE IF NOT EXISTS` SQL statement via `psql "$DATABASE_URL"` matching the Drizzle schema exactly (column names/types/defaults), instead of fighting drizzle-kit push. Do this before running api-spec codegen so downstream code can find the schema/table in place.

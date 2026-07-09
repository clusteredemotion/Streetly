---
name: Streetly schema/DB drift
description: Code can reference usersTable columns that were never actually migrated onto the live database.
---

While implementing the password-setup-link feature (2026-07-09), `POST /auth/login`
failed with a raw Drizzle "Failed query" error selecting `must_change_password`
from `users`. The column was already used throughout the codebase
(`mustChangePassword` in schema.ts, admin.ts, auth.ts, authHelpers.ts,
regional-manager.ts) but had never been applied to the actual database —
`drizzle-kit push` for this table fails without a TTY (see
`drizzle-push-tty.md`), and it looks like a prior task added the column to the
schema/code but the raw-SQL fallback for that specific column was skipped.

**Why:** Any `db.select()` on a table fails outright (500, not a partial
result) if the schema references a column the physical table doesn't have —
so one missing column can silently break every endpoint that touches that
table, not just the feature that added the column.

**How to apply:** Before trusting that an existing feature "already works"
based on code/memory alone, check `information_schema.columns` for the table
against the Drizzle schema file. If a column is missing, add it via raw SQL
(`ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`) rather than assuming
`drizzle-kit push` was run after the last schema change.

**Update (2026-07-09):** Recurred — `users.password_setup_token_hash` and
`users.password_setup_token_expires_at` were also missing, which broke
`POST /auth/login` and `/auth/register` for every account (not just one
feature), since the select lists every column. Before doing any auth-flow
testing, proactively diff `information_schema.columns` for `users` against
`lib/db/src/schema/users.ts` and backfill any gaps first.

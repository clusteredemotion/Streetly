---
name: Schema/DB drift root cause and fix
description: Why users/businesses tables drifted from lib/db/src/schema and how it was resolved (drizzle-kit push naming/TTY issue)
---

Two kinds of drift caused `drizzle-kit push --force` to fail non-interactively (TTY prompt) or leave the DB out of sync with `lib/db/src/schema`:

1. Missing column (e.g. `users.password_setup_token_hash`, `password_setup_token_expires_at`): a schema field was added in code but never pushed, so runtime queries selecting/inserting it broke (admin login, etc). Root cause was schema changes not being pushed after being written — always run `pnpm --filter @workspace/db run push` after schema edits, don't rely solely on the post-merge hook if testing locally before merge.

2. Constraint name mismatch: some unique constraints in the dev DB were named with the legacy Postgres default (`<table>_<col>_key`) instead of Drizzle's expected `<table>_<col>_unique`. Drizzle's push sees this as "add a new unique constraint" and prompts an interactive truncate-confirmation, which fails under `--force` with no TTY (see drizzle-push-tty.md). Fixed by `ALTER TABLE ... RENAME CONSTRAINT ... TO ...` to match Drizzle's naming convention. A `businesses.slug` unique constraint was also fully missing (added directly with `ALTER TABLE ADD CONSTRAINT`, verified no dupes/nulls first).

**Why:** Any historical constraint created outside of a clean `drizzle-kit push` (e.g. manual SQL, an older migration tool) can carry a non-Drizzle name and will silently reappear as "drift" on every future push, blocking non-interactive CI/post-merge pushes.

**How to apply:** If `push`/`push-force` reports an unexpected "add constraint" or truncate-confirmation prompt for a constraint that functionally already exists, check `pg_constraint` for a name mismatch before assuming a real schema change is needed — rename instead of dropping/recreating.

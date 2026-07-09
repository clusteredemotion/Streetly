---
name: Streetly requireRole select columns
description: Shared role-check auth middleware must select a narrow column set, not the full user row, due to schema/DB drift
---

The shared `requireRole(...roles)` middleware in `authHelpers.ts` intentionally
selects only `{ id, role, mustChangePassword }` from `usersTable`, instead of
`db.select()` (full row) like `requireAuth` does.

**Why:** the `users` table in the actual DB is missing columns that exist in
the Drizzle schema (e.g. `password_setup_token_hash`,
`password_setup_token_expires_at` — see the schema/DB drift memory entry). A
full-row select on any request hits the missing columns and 500s. The
route-local role checks this replaced (in admin.ts and regional-manager.ts)
always used narrow selects, so keeping `requireRole` narrow preserves that
working behavior instead of regressing it.

**How to apply:** when adding new shared auth/role middleware, prefer an
explicit narrow column list over `db.select()` on `usersTable` until the
schema drift is fixed. If you need more user fields in a specific route,
add just those fields to that route's own select rather than switching the
shared middleware to a full-row select.

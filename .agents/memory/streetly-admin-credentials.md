---
name: Streetly admin credentials
description: Where to find/how admin login works for e2e testing the Streetly admin dashboard.
---

The admin account is not managed via a secret or env var. `ensureAdminUser()` in
`artifacts/api-server/src/index.ts` seeds a fixed admin user (email
`admin@mystreetly.app`, hardcoded password hashed with
`sha256(password + "streetly_salt")`) — but only if no user with role `admin`
already exists. It no longer overwrites credentials on every boot.

**Why:** The seed originally ran an unconditional upsert (reset password_hash
+ role on every server start) so any custom email/password the admin set via
the in-app "Settings > admin credentials" panel was silently wiped back to the
hardcoded default on the next restart, causing "Access denied" / login
failures the user couldn't explain. Fixed by gating the seed on "does an admin
already exist" — it now only creates the bootstrap admin once, never resets an
existing admin's credentials.

**How to apply:** If you need to log in as admin (e.g. for e2e testing the
admin dashboard) on a fresh/never-seeded DB, read `ensureAdminUser()` to get
the default email/password. If an admin already exists with different
credentials (changed via Settings), those are authoritative — don't assume
the hardcoded default still works, and never re-introduce an unconditional
credential reset in that seed function.

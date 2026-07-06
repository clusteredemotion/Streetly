---
name: Streetly admin credentials
description: Where to find/how admin login works for e2e testing the Streetly admin dashboard.
---

The admin account is not managed via a secret or env var. `ensureAdminUser()` in
`artifacts/api-server/src/index.ts` upserts a fixed admin user (email
`admin@mystreetly.app`) on every server boot, hashing a hardcoded password with
`sha256(password + "streetly_salt")`.

**Why:** This project has no admin-invite flow; the seed function is the only
way an admin account exists at all, so the credentials are effectively fixed
in code rather than secret-managed.

**How to apply:** If you need to log in as admin (e.g. for e2e testing the
admin dashboard), read `ensureAdminUser()` directly to get the current
email/password rather than asking the user or guessing.

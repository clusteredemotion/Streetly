---
name: Streetly duplicated auth middleware
description: admin.ts implements its own copy of token/role-check logic separate from authHelpers.ts — auth-gating changes must be duplicated.
---

`artifacts/api-server/src/routes/admin.ts` defines its own `getUserIdFromAuthHeader` and
`requireAnyRole` functions rather than importing `requireAuth` from
`../lib/authHelpers.ts`. The two implementations decode the same bearer-token
format but are entirely separate code paths.

**Why:** Likely grew organically — admin.ts needed role-based gating
(`requireAnyRole(...roles)`) which authHelpers.ts didn't originally support,
so a parallel implementation was added instead of extending the shared one.

**How to apply:** Any change to authentication behavior that should apply
platform-wide (e.g. blocking users with a `mustChangePassword` flag, changing
token expiry/validation, blocking suspended accounts) must be made in BOTH
`authHelpers.ts` (`requireAuth`) AND `admin.ts` (`requireAnyRole`), or admin
routes will silently diverge from the rest of the API.

Beyond admin.ts, several other route files (`agents.ts`, `claims.ts`,
`deliveries.ts`, `marketplace-items.ts`, `riders.ts`, `support-tickets.ts`,
`regional-manager.ts`) also parse the bearer token themselves via local
`getUserIdFromReq`/`getUser` helpers instead of `requireAuth`. A platform-wide
auth gate (e.g. `blockIfMustChangePassword` in `authHelpers.ts`) must be
applied via `router.use(...)` in every one of these files individually —
grep for `verifyToken|getUserIdFromAuthHeader|getUserIdFromReq` across
`artifacts/api-server/src/routes` to find the current full list before
assuming `requireAuth` alone covers all protected endpoints.

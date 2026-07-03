---
name: Streetly auth pattern
description: How protected routes authenticate requests in the Streetly api-server (no middleware, manual Bearer token check)
---

Streetly's api-server has no auth middleware. Every protected route handler manually reads the `Authorization: Bearer <token>` header and calls `verifyToken` (from `routes/auth.ts`) to resolve `{ userId }`. Admin-only checks are done per-route by loading the user row and checking `user.role === "admin"` — there is no separate admin middleware either.

**Why:** This is the established convention across all existing routes (claims, messages, contact, support-tickets, admin). Introducing Express middleware for a subset of routes would create an inconsistent auth model.

**How to apply:** When adding a new protected endpoint, copy the pattern: check `req.headers.authorization`, call `verifyToken`, then explicitly re-check role/ownership inside the handler before proceeding. Don't assume a global middleware will reject unauthenticated requests.

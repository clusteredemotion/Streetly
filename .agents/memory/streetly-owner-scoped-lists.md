---
name: Streetly owner-scoped resource lists
description: Public list endpoints filter to approved-only; owner dashboards need a dedicated auth-scoped endpoint to see their own pending/rejected items
---

The generic public `GET /businesses` (and similarly-shaped list endpoints) filters to `status = 'approved'` only and has no per-owner filtering. Any "my dashboard" UI that reuses the public list hook will silently never show the current user's own pending or rejected records.

**Why:** Found via e2e testing — after adding business self-onboarding (creates `status: 'pending'`), the Owner Dashboard used the public `useListBusinesses` hook and never displayed the newly created pending business, since that hook only returns approved rows with no ownership filter.

**How to apply:** For any "my X" dashboard view, add a dedicated authenticated `GET /<resource>/mine` route (filtered by `ownerId = currentUser.id`, all statuses) instead of reusing the public list endpoint. Wire it into the OpenAPI spec and regenerate before pointing the frontend at it.

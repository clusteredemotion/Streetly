---
name: Streetly user roles
description: What roles exist in the users.role enum and how regular customers are represented
---

The `user_role` Postgres enum (defined in `lib/db/src/schema/users.ts`) is: `visitor`, `business_owner`, `field_agent`, `admin`, `delivery_rider`.

There is no `"customer"` role. Regular end-users/customers register and are stored with role `"visitor"`.

**Why:** Registering a user with `role: "customer"` fails the insert with a Postgres enum constraint violation (500 error), which looks like an app bug but is actually just using the wrong role value.

**How to apply:** When writing test plans, seed scripts, or new features that need a "regular customer" account, use role `"visitor"`, not `"customer"`.

Also: `POST /auth/register` requires body keys `{ name, email, password, role }` — not `fullName`. `fullName` is only used by the separate rider/agent application forms (e.g. `POST /riders/apply`), not the base user registration endpoint.

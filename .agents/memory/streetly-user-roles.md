---
name: Streetly user roles
description: What roles exist in the users.role enum and how regular customers are represented
---

There is no `"customer"` role in the `user_role` enum. Regular end-users/customers register and are stored with role `"visitor"`.

**Why:** Registering a user with `role: "customer"` fails the insert with a Postgres enum constraint violation (500 error), which looks like an app bug but is actually just using the wrong role value.

**How to apply:** When writing test plans, seed scripts, or new features that need a "regular customer" account, use role `"visitor"`, not `"customer"`.

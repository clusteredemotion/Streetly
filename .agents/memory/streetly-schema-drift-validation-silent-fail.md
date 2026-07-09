---
name: Streetly db-schema-drift validation silent failure
description: The db-schema-drift Replit validation workflow can itself fail to run (not just fail its check) if lib/db's node_modules is stale.
---

The `db-schema-drift` workflow (isValidation = true) runs
`pnpm --filter @workspace/db run check-drift`, which shells out to `tsx`.
If `lib/db/node_modules/.bin/tsx` is missing (e.g. after a partial or stale
install), the script fails with `sh: tsx: command not found` / ENOENT —
this looks like a validation failure but is actually the guard itself
being broken, not a real schema drift.

**Why:** A guard that silently can't run is worse than no guard — it gives
false confidence that schema drift is being caught. This exact failure mode
happened in production and caused all logins to 500 until diagnosed.

**How to apply:** If `db-schema-drift` (or any check that shells to a
workspace-local binary) fails with a "command not found" style error rather
than an actual drift report, run `pnpm install` at the repo root first and
re-run before concluding there's a real drift or logic bug. Always confirm
the workflow prints its actual pass/fail message (e.g. "No schema drift
detected") — don't trust a FAILED status alone without reading the log.

---
name: New workspace lib tsconfig composite requirement
description: TS6306 error when a new lib package is added to another package's tsconfig references.
---

When creating a new package under `lib/` (e.g. from a template like
object-storage-web) and adding it to a consuming package's `tsconfig.json`
`references` array (or the root `tsconfig.json` references), the new
package's own `tsconfig.json` must set `"composite": true` (and typically
`"declarationMap": true` alongside it, matching sibling libs like `lib/db`).

**Why:** TypeScript project references require every referenced project to be
composite; without it, `tsc --build` / any consumer typecheck fails with
`TS6306: Referenced project '...' must have setting "composite": true`.

**How to apply:** After scaffolding a new lib and wiring it into
`references`, check its `tsconfig.json` compilerOptions against an existing
lib (e.g. `lib/db/tsconfig.json`) before running `pnpm -w run typecheck:libs`.

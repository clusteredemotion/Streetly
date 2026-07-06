---
name: Streetly codegen GET hooks
description: OpenAPI codegen for this project's frontend can miss GET query hooks if the spec entry is incomplete; verify after every regen
---

When adding new backend routes and regenerating the api-client-react hooks from the OpenAPI spec (`lib/api-spec/openapi.yaml`, `pnpm --filter @workspace/api-spec run codegen`), a correctly-specified GET path (operationId + response schema, placed before any conflicting `{param}` catch-all route) reliably produces a working `useXxx` query hook — confirmed working for a freshly added `/businesses/mine` GET route.

**Why:** An earlier session saw GET query hooks missing after codegen, which was assumed to be a general codegen limitation. Re-tested with a clean, complete spec entry and the hook generated correctly, suggesting the earlier misses were caused by incomplete/malformed spec entries (e.g. missing schema, wrong route order) rather than a hard codegen limitation.

**How to apply:** After running codegen, grep the generated client (`lib/api-client-react/src/generated/api.ts`) for the expected `useXxx` hook name to confirm it exists before wiring it into a component. If it's genuinely missing, double-check the openapi.yaml entry (operationId, response schema, path ordering) before falling back to a hand-written raw-fetch `useQuery` hook.

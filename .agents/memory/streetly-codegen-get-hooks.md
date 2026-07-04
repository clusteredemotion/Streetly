---
name: Streetly codegen GET hooks
description: OpenAPI codegen for this project's frontend often only emits mutation hooks, not query hooks
---

When adding new backend routes and regenerating the api-client-react hooks from the OpenAPI spec, GET endpoints don't always get a corresponding `useXxx` query hook emitted — only POST/PATCH/DELETE mutation hooks reliably show up.

**Why:** Mutation hooks are generated reliably, but GET query hooks for several new endpoints were missing after codegen (observed across multiple new route groups).

**How to apply:** After running codegen, check whether needed GET hooks actually exist in the generated client. If missing, hand-write a raw-fetch `useQuery` hook instead of waiting on codegen — mirror existing hand-written query hook patterns already in the codebase.

---
name: Streetly codegen GET hooks
description: OpenAPI codegen for this project's frontend often only emits mutation hooks, not query hooks
---

When adding new backend routes and regenerating the api-client-react hooks from the OpenAPI spec, GET endpoints don't always get a corresponding `useXxx` query hook emitted — only POST/PATCH/DELETE mutation hooks reliably show up.

**Why:** Observed with the riders/deliveries feature: mutation hooks like `useApplyAsRider`, `useSetRiderOnlineStatus`, `useCreateDeliveryOrder` were generated, but no GET query hooks for `/riders/by-user`, `/riders/nearby`, `/riders/:id/orders`, `/deliveries/:id`, or any `/admin/*` list endpoints.

**How to apply:** After running codegen, check whether needed GET hooks actually exist in `lib/api-client-react/src/generated/api.ts`. If missing, hand-write a raw-fetch `useQuery` hook instead of waiting on codegen — mirror the existing pattern in `AdminPage.tsx` (standalone `function useXxx() { return useQuery({ queryKey, queryFn: () => fetch(`${BASE}/api/...`, { headers: authHeader() }) }) }`).

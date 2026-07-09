---
name: Streetly admin portal optimistic loading
description: AdminPage briefly renders the full admin UI for non-admin tokens while the /auth/me check is loading, before redirecting away.
---

`AdminPage`'s `isAdminAuth` is `true` whenever a token exists AND (`adminUserLoading`
OR role is admin) — so while `/api/auth/me` is in flight, any authenticated
non-admin role (rider, moderator, etc.) briefly renders the full admin dashboard,
including components that call admin-only endpoints, before the role check
resolves and the redirect-away `useEffect` fires.

**Why:** Any component rendered during that window whose data-fetching doesn't
check `res.ok` will treat a 403 `{error: "Forbidden"}` body as valid data and
can crash (e.g. `AdminAnalytics` did `data.statusBreakdown.find(...)` on the
error object), which throws before the redirect effect commits — breaking the
redirect-to-correct-portal feature for that role entirely.

**How to apply:** When adding new components/hooks to `AdminPage` (or the
equivalent moderator/scout-manager staff pages) that fetch admin-only data,
always check `res.ok` and throw/guard on failure so a 403 during the loading
window degrades to an empty/error state instead of crashing the page.

**Related pitfall — hook-order crash from the "fix":** the naive fix of adding
an early `if (checking) return <Loader/>` *before* the role-only data hooks
are called is itself a Rules-of-Hooks violation: on the render where
`checking` flips false, React sees more hooks called than the previous render
and throws "Rendered more hooks than during the previous render", crashing
exactly during the loading→ready transition (seen in
`ModeratorDashboardPage.tsx`). Always call all hooks unconditionally at the
top of the component and put the `checking`/`!token` early returns *after*
all hook calls (gate the hooks themselves with an `enabled` param instead).

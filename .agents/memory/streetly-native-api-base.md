---
name: Streetly native app API base URL
description: Why the Android/Capacitor build needs an absolute API base while the web build uses relative paths
---

The Capacitor Android app used to set `server.url` to the production domain, so the WebView always fetched the live app shell remotely — meaning it had no offline-capable shell and showed Android's native error page (not the in-app Preloader) when offline.

**Why:** Once `server.url` is removed so the WebView loads the bundled `webDir` locally (works offline), relative `fetch("/api/...")` calls resolve against the local/native origin instead of the production API, breaking every request.

**How to apply:** Native builds must force an absolute API origin. `getApiBase()` in `artifacts/streetly/src/lib/utils.ts` returns the production origin when `Capacitor.isNativePlatform()` is true, else `""` (relative, for web). All ~30 files that build fetch URLs from a local `BASE` constant must call `getApiBase()` instead of deriving it from `import.meta.env.BASE_URL` (which only encodes the router base path, not the API origin). The generated `@workspace/api-client-react` hooks get the same absolute base via `setBaseUrl()` inside `initApi()`. Router base path (`import.meta.env.BASE_URL`, used by Wouter) is unrelated and unaffected. After changing `capacitor.config.ts`, always run `npx cap sync android` so `android/app/src/main/assets/capacitor.config.json` picks up the change — it's a generated file, not hand-edited.

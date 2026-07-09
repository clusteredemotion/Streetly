---
name: Streetly Gradle release keystore path resolution
description: Why the signed release Android build failed even with correct secrets, and the fix
---

In a Gradle module's `build.gradle` (e.g. `android/app/build.gradle`), the `file(path)` function resolves relative to that module's own project directory, NOT the Gradle root project directory. Use `rootProject.file(path)` if the path is meant to be relative to the Android root (`android/`).

**Why:** The android-apk.yml workflow decodes the release keystore to `android/keystore/streetly-release.keystore` (relative to the `android/` root), but `app/build.gradle`'s signingConfig used `file(storeFilePath)` with a root-relative env var path — Gradle looked for it under `android/app/keystore/...` instead, so the keystore was never found even though secrets were present and decoded correctly.

**How to apply:** When wiring keystore/signing paths (or any file path) from CI env vars into a module-level `build.gradle`, always check which directory the path is relative to and use `rootProject.file()` vs `file()` accordingly — a working debug build won't reveal this since it doesn't reference a signing keystore path at all.

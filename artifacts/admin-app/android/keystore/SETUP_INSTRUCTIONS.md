# Streetly Release Signing — Setup Instructions

## 1. Save these files permanently, somewhere safe (e.g. a password manager or encrypted backup)

- `streetly-release.keystore` — your signing key. **If you lose this file, you can NEVER publish an update to the same Play Store listing again** — Google requires every update to be signed with the same key forever.
- `streetly-keystore-password.txt` — contains the store/key password.
- Key alias: `streetly`

These files are already excluded from git (`.gitignore`) so they are never committed to your repo.

## 2. Add these as GitHub Actions secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, and add:

| Secret name | Value |
|---|---|
| `STREETLY_KEYSTORE_BASE64` | Run `base64 -w0 streetly-release.keystore` and paste the full output |
| `STREETLY_KEYSTORE_PASSWORD` | The password from `streetly-keystore-password.txt` |
| `STREETLY_KEY_ALIAS` | `streetly` |

(The same password is used for both the keystore and the key itself.)

## 3. Trigger the release build

Go to the **Actions** tab on GitHub → "Build Streetly Admin APK" → **Run workflow** (manual trigger only — release builds don't run automatically on every push, only debug APKs do).

This produces a downloadable artifact:
- `streetly-admin-release-apk` — a signed APK you can install directly on a device to test the release build

## 4. Before submitting to Google Play

- Update `capacitor.config.ts` → `server.url` to your final published domain (not the dev preview).
- Create a Google Play Console developer account ($25 one-time fee) and create a new app listing.
- Upload the `.aab` file from the release build.

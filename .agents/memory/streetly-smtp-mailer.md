---
name: Streetly SMTP mailer
description: How outgoing email sending works in the Streetly api-server and how it fails safely when unconfigured
---

The api-server has a `sendMail()` helper (`artifacts/api-server/src/lib/mailer.ts`) that reads SMTP config from the raw `settings` key/value table (populated by the Admin > Email & Account settings UI) on every call — it does not cache the transporter. If `smtp_host`/`smtp_user`/`smtp_password`/`smtp_from_email` are missing, it logs a warning and returns `false` instead of throwing.

**Why:** Admin SMTP settings are optional and can be blank out of the box (no real provider configured by default). Callers (contact form, support ticket creation/replies) fire-and-forget `sendMail(...).catch(() => {})` so a missing/broken SMTP config never blocks the underlying feature (ticket creation, contact submission, etc.) from succeeding.

**How to apply:** When wiring a new notification email, call `sendMail` and `getAdminNotificationEmail()` from the mailer, but never `await` in a way that would fail the parent request if the email fails — treat email delivery as best-effort.

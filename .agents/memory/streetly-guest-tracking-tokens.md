---
name: Streetly guest resource access tokens
description: How to let unauthenticated users access a specific record they created, without login
---

For flows where an unauthenticated ("guest") user creates a record and needs to view it later without logging in, never derive the access token deterministically from the record's id (e.g. `HMAC(id)` with a fixed secret) — it's forgeable/enumerable by anyone who can read the code, and can't be revoked or rotated per-record.

**Why:** A code-review rejected exactly this pattern for guest delivery-order tracking: a hardcoded HMAC secret producing a deterministic per-order token was flagged as a real security exposure (non-rotatable, non-expiring, guessable once the algorithm is known).

**How to apply:** Generate a random token (`crypto.randomBytes`) per record at creation time, return the plaintext to the client exactly once, and store only a hash (plus an expiry) on the record. Verify by hashing the client-supplied token and comparing with a timing-safe equality check against the stored hash; also enforce expiry. Strip the hash/expiry fields from all API responses.

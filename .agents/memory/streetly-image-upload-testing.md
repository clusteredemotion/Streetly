---
name: Streetly image upload testing pitfall
description: e2e testing subagent misidentifies file inputs on pages with multiple upload widgets; base64 image convention for new upload features
---

## Multiple file inputs confuse the e2e testing subagent
When a page has more than one `<input type="file">` (e.g. a "Business Photos" uploader plus a per-row "Product image" uploader), the Playwright-based testing subagent frequently grabs the wrong one via `.first()` even when explicitly told to scope/target a specific row, and sometimes reports stale/mismatched DOM refs after a React re-render (e.g. claims no `<img>` preview rendered while simultaneously reporting a data-URL `<img>` exists elsewhere on the page).

**Why:** Observed repeatedly across ~6 test attempts on the product-image-upload feature — code review confirmed correct React state updates, and direct backend curl calls proved the full pipeline (compress → base64 dataURL → POST → DB) worked every time, while UI-level `runTest` calls kept failing on selector/targeting grounds.

**How to apply:** When a `runTest` failure report is inconsistent (e.g. contradicts itself, or admits "used the first input found" despite instructions), don't trust it at face value — cross-check with a direct backend request (curl with a real base64 payload) and/or a DB query before concluding there's a real app bug. This is especially relevant for multi-file-input forms in this app.

## Base64 data-URL convention for images
Streetly does not use object storage for business photos or marketplace item images — client-side `compressImage(file)` (canvas resize + `toDataURL("image/jpeg", 0.82)`) produces a base64 data URL that's stored directly in the relevant text column (`business_photos.url`, `marketplace_items.image_url`). Follow this same pattern for any new image-upload feature in Streetly rather than introducing object storage.

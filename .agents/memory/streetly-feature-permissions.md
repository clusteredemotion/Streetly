---
name: Streetly Feature Permissions System
description: How per-user feature gating works end-to-end (DB, API, admin UI, staff dashboards)
---

## Rule
The Feature Permissions system gates staff dashboard sections based on admin-granted keys stored in `user_features` table.

## DB
- Table: `user_features` (user_id, feature_key, granted_by_id, created_at)
- Unique constraint: (user_id, feature_key)
- 20 feature keys defined in featureRegistry.ts in both api-server and streetly

## API
- `GET /api/admin/users/:id/features` → `{ features: string[] }`
- `PUT /api/admin/users/:id/features` → body `{ features: string[] }`, returns validated keys
- `GET /api/auth/me` → now includes `features: string[]` (admin = ALL_FEATURE_KEYS, others = DB grants)

## Admin UI
- Feature Permissions panel is in User Profiles section, shown for ALL user roles
- Toggles each of the 20 features per-user, saves immediately on toggle
- Grant All / Revoke All buttons; N/20 counter; admin shows read-only "Full Access" badge

## Staff Dashboards
- Each NAV item has a `featureKey` field mapping to the feature registry key
- Filter: `ALL_NAV.filter(n => features.length === 0 || features.includes(n.featureKey))`
- `features.length === 0` → show all sections (backward compatible with unconfigured staff)
- `features.length > 0` but no matching section → show "No sections enabled" message

## Moderator feature keys
- pending → manage_businesses
- photos → manage_gallery
- featured → manage_featured
- tickets → manage_support

## ScoutManager feature keys
- agents → manage_agents
- commissions → manage_commissions
- categories → manage_categories
- properties → manage_properties

**Why:** Features are opt-in grants; empty array means "use defaults" not "no access".

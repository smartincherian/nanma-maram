# Superadmin role — design

Date: 2026-06-26
Branch: feature/video-tracking

## Problem

The app currently has a de-facto three-tier access model:

- **not allowed** — signed out, or signed in but email not in the `admins`
  Firestore collection → sees `AdminRouteGate`.
- **admin** — email in `admins` with `role: "admin"` → `isAllowed: true`.
- **owner** — `admins` doc with `role: "owner"` → `isOwner: true`.

`isOwner` already gates VideoConfig (crew management), the Videos "Crew"
button, and the per-row delete buttons on the Manage Admins page.

We want a clearly-named **superadmin** tier that is one specific account
(`smartin.cherian@gmail.com`), and we want **Manage Admins** to be the
feature reserved to that account.

## Decisions

- **superadmin == the existing top tier, renamed.** `owner` → `superadmin`;
  the auth flag `isOwner` → `isSuperAdmin`. No new fourth tier.
- **Source of truth = hardcoded email**, not the Firestore `role` field.
  `isSuperAdmin = isAllowed && isSuperAdminEmail(user.email)`.
- **Only Manage Admins is restricted** to superadmin. The other gates that
  used to be owner-only (VideoConfig / crew, Videos "Crew" button, admin
  delete) **open up to all admins** — except admin delete, which lives on the
  now superadmin-only Manage Admins page and is therefore reachable only by
  superadmin anyway.

Net effect:
- **regular admin** — everything except Manage Admins.
- **superadmin (smartin)** — everything, including Manage Admins.

## Changes

### 1. `src/config/roles.js` (new) — single source of truth

```js
export const SUPERADMIN_EMAILS = ["smartin.cherian@gmail.com"];

export const isSuperAdminEmail = (email) =>
  !!email && SUPERADMIN_EMAILS.includes(email.toLowerCase());
```

An array (not a bare string) so adding a second superadmin later is a one-line
edit.

### 2. `src/components/AuthProvider/index.jsx`

- Rename context field `isOwner` → `isSuperAdmin` (default `false`, state
  `isSuperAdmin`/`setIsSuperAdmin`).
- Derive from email instead of role:
  `setIsSuperAdmin(admin !== null && isSuperAdminEmail(nextUser.email))`.
  (Requires being an allowlisted admin AND on the hardcoded list.)
- Reset `isSuperAdmin` to `false` in the signed-out and error branches.

### 3. `src/pages/Home/index.jsx`

- Read `isSuperAdmin` from `useAuth()`.
- Add `superAdminOnly: true` to the `Manage Admins` menu item.
- Filter `menuItems` so `superAdminOnly` tiles render only when
  `isSuperAdmin`.

### 4. `src/pages/Admins/index.jsx`

- Replace `isOwner` from `useAuth()` with `isSuperAdmin`.
- Guard the whole page: if `!isSuperAdmin`, render a "Super admins only"
  message instead of the management UI (so a regular admin can't reach it via
  the URL).
- The "Owner" chip (currently `admin.role === "owner"`) becomes a
  "Super Admin" chip driven by `isSuperAdminEmail(admin.email)`.
- Remove the now-redundant per-button `isOwner` check on delete (page guard
  already restricts to superadmin); keep `!isSelf`.

### 5. `src/pages/VideoConfig/index.jsx`

- Remove the `isOwner` guard and the "Owners only" fallback — page is now
  available to all admins.

### 6. `src/pages/Videos/index.jsx`

- Remove the `isOwner` condition around the "Crew" button — show it to all
  admins.

### 7. Housekeeping

- Firestore `role` field left untouched; `addAdmin` keeps writing
  `role: "admin"`. It no longer determines superadmin.
- Tests: no new tests (per CLAUDE.md). Update existing references to
  `isOwner` / `owner` in `AuthProvider.test`, `Admins.test`, and any
  ProtectedRoute/VideoConfig tests so they reflect the rename and the
  email-based source. Keep them green.
- Bump `version` in `package.json` (minor) via
  `npm version minor --no-git-tag-version`.

## Out of scope

- No fourth tier.
- No change to the `admins` Firestore schema.
- No change to crew (`isCrew`) logic.

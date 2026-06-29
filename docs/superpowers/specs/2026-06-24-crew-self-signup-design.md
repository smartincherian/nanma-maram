# Crew Self-Signup — Design

**Date:** 2026-06-24
**Branch:** feature/video-tracking

## Problem

The video pipeline needs people ("crew") to do editing work (shorts, long-form,
promos, thumbnails, captions, content checks). Today the only way onto the app is
the `admins` allowlist: a person is either an **admin** (full app access via
`AdminRouteGate` → `ProtectedRoute`) or **blocked**. There is no way for a crew
member to get in.

We want crew to **self-sign up** with their Gmail account, set a few details, and
gain access to a crew-only area — without becoming admins and without touching the
admin-only video section.

## Goals (this spec)

Register + signup working **end-to-end**:

1. A new person can sign in with Google and register as crew (name/email from the
   Google profile, plus phone and skills).
2. The record is saved and the person is recognized as crew on subsequent visits.
3. A registered crew member lands on a crew-only landing page (placeholder).
4. An admin can deactivate any crew email at any time.

**Out of scope (later spec):** the real crew portal — availability toggle, pending
work list, assignment of crew to video stages.

## Decisions (from brainstorming)

- **Access scope:** Crew get their **own** area at `/crew`. The existing video
  section (`/videos`, `/video-config`, `/admins`, prayer features) stays
  **admin-only** and is unchanged.
- **Approval:** Self-signup is **active immediately**. An admin can deactivate an
  email anytime (sets `active: false`).
- **Skills:** **Hardcoded constant** (7 skills).
- **New-user flow:** A signed-in person who is neither admin nor crew sees the
  **register form** (replaces the "denied" experience for them, on the crew route).
- **Phone:** **Free text, light validation** (non-empty).
- **Crew identity storage:** Reuse the existing `videoCrew` collection, but key
  self-signup accounts by **lowercased email as the document ID** (same pattern as
  `admins`). Trade-off: any legacy auto-ID rows from the old CrewTab won't carry
  over — acceptable, crew is new on this feature branch.

## Architecture

### Roles & gating

`AuthProvider` (`src/components/AuthProvider/index.js`) currently looks up the
`admins` record on each `onAuthStateChanged` and exposes `user`, `isAllowed`,
`isOwner`, `loading`. It gains:

- `crew` — the crew record (`{ email, name, phone, skills, active, createdAt }`)
  or `null`.
- `isCrew` — `true` when a crew record exists **and** `active !== false`.

It performs one additional Firestore read (crew lookup by email) alongside the
existing admin lookup. Both lookups complete before `loading` flips to `false`.

The admin `ProtectedRoute` / `AdminRouteGate` are **not modified** — the crew flow
is fully separate.

### Routes (in `src/App.js`)

| Path | Page | Gate |
|------|------|------|
| `/crew/join` | `CrewJoin` — register screen | Own gate logic (see below) |
| `/crew` | `CrewHome` — crew landing placeholder | Requires active crew, else redirect to `/crew/join` |

These are declared outside the admin `ProtectedRoute` wrapper, similar to how the
public prayer-bank routes are handled.

### `/crew/join` flow (CrewJoin)

Driven by `useAuth()` state:

- **Not signed in** → themed "Sign in with Google to join the crew" screen
  (Google button; reuses `AdminRouteGate`'s warm background/card styling).
- **Signed in + active crew** → `<Navigate to="/crew" />`.
- **Signed in + admin** → gentle note: "You're an admin — head to Videos"
  (link to `/videos`).
- **Signed in + crew but deactivated** (`crew` exists, `active === false`) →
  "Your crew access is paused. Please contact an admin."
- **Signed in + neither admin nor crew** → **register form**:
  - Name (prefilled from `user.displayName`, read-only).
  - Email (prefilled from `user.email`, read-only).
  - Phone (free text, required, light validation).
  - Skills (multi-select from `CREW_SKILLS`; at least one required).
  - Submit → `registerCrew(...)` → on success `<Navigate to="/crew" />`.

### `/crew` (CrewHome) — placeholder

Requires `isCrew`. If `loading` → spinner; if not crew → redirect to `/crew/join`.
Shows the member's name, email, phone, and skill chips, a sign-out button, and a
"Availability & your work list — coming soon" section. Warm themed, mobile-first.

### Data layer (`src/firebase/video/crew.js`)

New helpers (alongside existing `listCrew`/`addCrew`/`updateCrew`/`deleteCrew`):

```js
// Look up a crew account by email (doc ID = lowercased email). Returns
// { id, ...data } or null.
fetchCrewByEmail(email)

// Create/replace a crew account, active immediately. setDoc keyed by email.
registerCrew({ email, name, phone, skills })
//   → setDoc(doc(DB, "videoCrew", email.toLowerCase()), {
//        name, email: email.toLowerCase(), phone, skills,
//        active: true, createdAt: serverTimestamp() })

// Toggle only the active flag (preserves name/phone/skills).
setCrewActive(id, active)
//   → updateDoc(doc(DB, "videoCrew", id), { active })
```

`registerCrew` trims/validates: name and phone non-empty, `skills` a non-empty
array; throws a clear `Error` otherwise.

### Skills constant (`src/utils/crewSkills.js`)

```js
export const CREW_SKILLS = [
  "Shorts",
  "Long",
  "Promo",
  "Thumbnail",
  "Caption",
  "Before editing content checking",
  "After editing content checking",
];
```

### Admin deactivation (`src/pages/VideoConfig/CrewTab.jsx`)

Extended so each crew row shows the member's **email**, **phone**, and **skill
chips**, plus an **Active toggle** that calls `setCrewActive(id, active)` — pausing
or restoring an email without wiping other fields. The existing add/edit/delete
dialogs remain; the edit-save path is adjusted to preserve `skills`/`phone`/`email`
(spread existing fields) so editing name/active no longer clears them.

## Components / files

| File | Change |
|------|--------|
| `src/firebase/video/crew.js` | Add `fetchCrewByEmail`, `registerCrew`, `setCrewActive` |
| `src/utils/crewSkills.js` | New — `CREW_SKILLS` constant |
| `src/components/AuthProvider/index.js` | Add crew lookup → expose `crew`, `isCrew` |
| `src/pages/CrewJoin/index.jsx` | New — register screen + sign-in + state routing |
| `src/pages/CrewHome/index.jsx` | New — crew landing placeholder |
| `src/App.js` | Add `/crew/join` and `/crew` routes |
| `src/pages/VideoConfig/CrewTab.jsx` | Show email/phone/skills + Active toggle via `setCrewActive` |

## Error handling

- Google sign-in errors reuse the `AdminRouteGate` pattern (ignore
  `auth/popup-closed-by-user`, show a generic message otherwise).
- `registerCrew` failures surface via the existing `SnackbarContext`.
- Validation (empty name/phone/no skills) blocks submit with inline messaging.
- Firestore read failures in `AuthProvider` treat the user as non-crew (fail
  closed), mirroring the existing admin-lookup error handling.

## Testing

- `src/firebase/video/crew.test.js` — extend: `fetchCrewByEmail` (hit/miss/empty),
  `registerCrew` (payload shape, lowercasing, validation throws), `setCrewActive`
  (updates only `active`).
- `src/components/AuthProvider/index.test.js` — update existing tests for the new
  crew lookup; add cases: active crew → `isCrew true`, deactivated crew →
  `isCrew false`, no crew record → `isCrew false`.
- `CrewJoin` — render states: signed-out, register form (prefilled + validation),
  already-crew redirect, deactivated message.
- `CrewHome` — redirects non-crew; renders profile for crew.

## Theme

Warm amber/cream palette reused from `AdminRouteGate` (background/card) and
`src/pages/Videos/ui.js` (`amberButtonSx`, `cardSx`). Mobile-first responsive
layout consistent with the rest of the app (MUI v5, inline `sx`).

## Versioning

Bump `package.json` minor version (new feature) per the project's versioning
convention.

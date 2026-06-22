# Google Sign-In as the Admin/Leader Gate — Design

**Date:** 2026-06-22
**Status:** Approved design, pending implementation plan

## Problem

Admin/leader routes are currently gated by a hardcoded code (`LEADER_CODE = "1305"`)
stored in `localStorage` under `leaderCodeAccess`. The code is shared, unrevocable,
and not tied to an identity. We want to replace it with Google sign-in restricted to
an allowlist of approved Gmail/Google accounts.

## Goals

- Replace the leader-code gate with **Sign in with Google** (Firebase Auth).
- Only emails present on a **Firestore allowlist** may enter protected routes.
- Accounts not on the allowlist are **redirected to the public app** (`https://nanmamaram.in/`).
- Public routes (open counters, prayer-bank reads, slot booking child routes) remain public.

## Non-Goals (YAGNI)

- No in-app allowlist management UI. Admins are added/removed via the Firebase Console.
- No server-side enforcement / Firestore security-rules rewrite in this change. The
  allowlist check stays client-side, consistent with the app's current model. Because
  users are now genuinely Firebase-authenticated, rules can be tightened later.
- No per-user roles/permissions beyond "is this email allowed".

## Architecture

### 1. Firebase config — `src/config/firebase.js`
Initialize and export auth alongside the existing `DB`:
- `export const AUTH = getAuth(app);`
- `export const googleProvider = new GoogleAuthProvider();`

### 2. Auth data layer — `src/firebase/auth/index.js`
Thin wrappers, mirroring the existing `src/firebase/intention/` pattern:
- `signInWithGoogle()` → `signInWithPopup(AUTH, googleProvider)`.
- `signOutUser()` → `signOut(AUTH)`.
- `isEmailAllowed(email)` → `getDoc(doc(DB, "admins", email.toLowerCase()))`; returns
  `true` if the doc exists.

**Allowlist collection:** `admins`. Each document's **ID is the lowercase email**.
Document body can be empty (or hold optional metadata like `addedBy`/`note`). Managed
manually in the Firebase Console. The first admin is seeded by hand (bootstrapping).

### 3. Auth context — `src/components/AuthProvider/index.jsx`
- Wraps the app inside `SnackbarProvider`.
- Subscribes via `onAuthStateChanged(AUTH, ...)`.
- When a user is present, calls `isEmailAllowed(user.email)` and caches the result.
- Exposes context value `{ user, isAllowed, loading }` via a `useAuth()` hook.
- State machine:
  - `loading = true` until the first auth state resolves (and, if signed in, the
    allowlist lookup completes).
  - `user = null` when signed out.
  - `isAllowed` is a tri-state in spirit but represented as boolean after `loading`
    settles: `false` until confirmed present in the allowlist.
- Firebase Auth persists the session itself (IndexedDB/localStorage), so the
  `leaderCodeAccess` localStorage key is removed.

### 4. `ProtectedRoute` — `src/App.js`
Replace `hasLeaderAccess()` logic with the auth context:

| State | Render |
|-------|--------|
| `loading` | Centered MUI spinner (full-height) |
| `!user` | `<AdminRouteGate />` (Google sign-in screen) |
| `user && !isAllowed` | Redirect to `https://nanmamaram.in/` (`window.location.replace`) |
| `user && isAllowed` | `children` |

Public-route carve-outs (`/register-prayer-bank`, `/prayer-bank/*`) and the already
unauthenticated routes (`/counter/:id`, slot booking child routes) are unchanged.

### 5. `AdminRouteGate` rewrite — `src/components/AdminRouteGate/index.jsx`
- Keep the existing branded card, logo, and "Go to Nanmamaram App" button.
- Remove the "For Admin" leader-code `TextField` + Enter button and all
  `LEADER_CODE` / `leaderCodeAccess` logic.
- Add a **"Sign in with Google"** button that calls `signInWithGoogle()`.
- Show a transient "Signing in…" state while the popup/redirect resolves; surface
  errors via the existing `Alert` styling or the global Snackbar.
- After a successful sign-in, `ProtectedRoute` re-evaluates and either renders the
  page or redirects (handled in §4, not here).

### 6. Sign-out affordance
Add a minimal sign-out control for signed-in admins on the Home page header
(`src/pages/Home`) that calls `signOutUser()`. Keep it unobtrusive.

## Data Flow

```
User hits protected route
  → AuthProvider resolves onAuthStateChanged
     → no user:   AdminRouteGate → "Sign in with Google" → popup → onAuthStateChanged fires
     → has user:  isEmailAllowed(email)
                     → allowed:     render route
                     → not allowed: redirect to nanmamaram.in
```

## Error Handling

- Popup closed/cancelled (`auth/popup-closed-by-user`): no error toast; just return to
  the sign-in screen.
- Network/Firestore failure during allowlist lookup: treat as **not allowed**, show a
  snackbar ("Couldn't verify access, please try again"), keep user on the gate with a
  retry/sign-out option rather than redirecting away.
- Other `signInWithGoogle` errors: surface message via snackbar.

## Testing

- Unit-test `isEmailAllowed` (email lowercased; existing doc → true, missing → false)
  with a mocked Firestore `getDoc`.
- Unit/component test for `AuthProvider` state transitions (loading → signed-out →
  signed-in-allowed / signed-in-denied) with `onAuthStateChanged` and `isEmailAllowed`
  mocked.
- Component test for `ProtectedRoute` rendering branches.
- Follow existing Jest/CRA + React Testing Library setup (see `chapelSlots.test.js`).

## Firebase Console setup (operational, not code)

1. Enable **Authentication → Sign-in method → Google** in the Firebase Console.
2. Add authorized domains (`nanmamaram.in`, `localhost`) under Authentication settings.
3. Create the `admins` collection and add the first admin: doc ID = your lowercase email.

## Versioning

Bump `package.json` version (minor — new feature) per the repo's versioning policy.
```

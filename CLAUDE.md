# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:3000
npm run build      # production build → build/
npm test           # Jest watch mode (CRA)
npm test -- --watchAll=false   # single run, no watch
npm test -- --testPathPattern=App  # run one test file
```

Deploy: `firebase deploy` (targets the `nanma-maram` Firebase project; deploys `build/` to Hosting).

## Testing

Tests are **not required** for a change to be considered done — there is no CI, git hook, or deploy gate running them, and the maintainer verifies UI manually. Do **not** write or update test files unless they're genuinely necessary (e.g. tricky pure business logic with no UI surface) or the user explicitly asks. When you do touch logic that already has tests, keep the existing tests green.

## Versioning

Bump the `version` in `package.json` (semver) with every meaningful change — patch for fixes/tweaks, minor for new features, major for breaking changes. This version is surfaced in the app footer (`ChapelFooter`) via `REACT_APP_VERSION`, so keeping it current is how releases are identified. Use `npm version patch|minor|major --no-git-tag-version` to bump without creating a git tag.

## Git

Never run `git commit` or `git push` unless the user explicitly tells you to. Make and stage changes, but leave committing to the user.

## Architecture

**Nanma Maram** is a React 18 SPA (Create React App) for Catholic group prayer tracking. Users submit prayer intentions, then anyone can increment a shared counter for each intention.

### Data layer — Firebase Firestore

All reads/writes live in `src/firebase/intention/`. The `DB` export from `src/config/firebase.js` is the shared Firestore instance.

- `intentions` collection — one document per prayer intention. Key fields: `count`, `maxCount`, `prayerType`, `isMotherIntention`, `collectionName`, `showLast5AndTop5`.
- Update-log collections (`rosaryUpdates`, `hailMaryUpdates`, `otherUpdates`, or a custom name from `collectionName`) — each `addCounter` call writes a log document `{ newCount, timestamp, user }` in the appropriate sub-collection.
- `addCounter` uses a **Firestore transaction** so the increment and the log write are atomic.

### Routing

Defined in `src/App.js`:

| Path | Page |
|------|------|
| `/` | Home — menu of all features |
| `/intention-add` | PrayerForm (create mode) |
| `/intention-mother` | PrayerForm with `path="mother"` |
| `/intention-edit/:id` | PrayerForm (edit mode, navigated to from IntentionsList) |
| `/intention-list` | IntentionsList — pick a counter to open |
| `/counter/:id` | Counter — live counter for one intention |

### Key pages

**Counter** (`src/pages/Counter/index.jsx`) is the most complex page. It uses `onSnapshot` for a real-time Firestore subscription, `react-hook-form` for the submit form, `canvas-confetti` (lazy-loaded) for celebration animations, and a `<audio>` ref for target-completion sound. Milestone logic: confetti fires at ≥100 added at once, on every lakh crossed, and when `maxCount` is first reached. Completion overlay is shown once per browser session (tracked in `sessionStorage`).

**PrayerForm** (`src/pages/PrayerForm/index.jsx`) doubles as create and edit mode (edit mode detected by `:id` param). It uses `onSnapshot` in edit mode so the current count stays live. The `bibleVerse` prayer type unlocks extra display-title and featured-verse fields rendered conditionally on the selected `prayerType`.

**IntentionsList** navigates to `/counter/:id` (open counter) or `/intention-edit/:id` (edit). Edit route is not declared in `App.js` yet — it resolves to PrayerForm.

### Auth / access control

There is no Firebase Auth. Edit/create operations require the user to type a hardcoded admin code (`ADMIN_CODE = "1305"` in `src/pages/PrayerForm/constants.js`), validated client-side via `react-hook-form`.

### Global UI

`SnackbarProvider` (`src/components/Snackbar/index.js`) wraps the whole app and exposes `{ showSnackbar, hideSnackbar }` via `SnackbarContext`. Import `useContext(SnackbarContext)` in any page to show toast notifications.

UI is Material UI v5 (MUI) throughout. No custom theme provider — components use default MUI theme with inline `sx` prop overrides.

### UI consistency

Keep repeated UI patterns visually and structurally identical — the same element should look and behave the same everywhere it appears. When two or more places share a pattern (dialog/bottom-sheet footers, action buttons, cards, chips, status colors), factor the styling into a shared `sx` constant (e.g. `sheetActionsSx`, `dismissButtonSx`, `amberButtonSx` in `src/pages/Videos/ui.js`) and reuse it rather than re-specifying `sx` inline per instance. Concretely:

- **Bottom-sheet / dialog footers** are a single `space-between` row: the secondary/dismiss action (Cancel/Close, styled with `dismissButtonSx`) at the left end, the primary action (Save/contained amber button via `amberButtonSx`) at the right end. Don't stack them vertically or full-width on mobile.
- **Status/urgency colors** come from the shared helpers (`getDueMeta`, `STATUS`/`STATUS_META` maps) — don't hardcode ad-hoc hex values for the same semantic state in different places.

When adding a new instance of an existing pattern, match the existing one; when changing the pattern, update the shared constant so every instance moves together.

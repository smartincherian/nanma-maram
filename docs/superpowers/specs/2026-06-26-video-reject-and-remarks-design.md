# Video rejection & remarks — design

**Date:** 2026-06-26
**Branch:** feature/video-tracking

## Goal

Let a video be **rejected** (e.g. after a content check, or before any processing
starts) without going through the 7-step pipeline, and let a free-text **remark**
be attached to a video at any time — including at the moment of rejection.

Rejected videos surface in the **Done** tab with a light-red card, distinct from
the green "completed" cards.

## Decisions (from brainstorming)

- **Remarks model:** a single editable note on the video (`remarks` string).
  Latest value only — no history/thread.
- **Reversibility:** rejection is **reversible** — a rejected video can be
  reactivated back to Active.
- **Remarks UI:** not shown by default. An "Add remarks" button at the bottom of
  the detail page reveals the text area when tapped. Once a remark exists it is
  displayed with an edit affordance.
- **Rejection UI:** a bottom-sheet confirmation containing an **optional** remarks
  field (not mandatory).
- Rejecting/reactivating does **not** touch the step (work) docs.

## Data layer

### `src/utils/videoWorkflow.js`
- Add `VIDEO_STATUS.REJECTED = "rejected"`.

### Video doc fields (Firestore `videos`)
- `remarks` — string, optional. Edited via existing `updateVideoMeta`.
- `rejectedAt` — timestamp. Set on rejection, cleared (set to `null`) on reactivate.

### `src/firebase/video/videos.js`
- `rejectVideo(id, { remarks }, by)` — single `updateDoc` setting
  `status: REJECTED`, `rejectedAt: serverTimestamp()`, `rejectedBy: by`, and
  `remarks` (only when a non-empty value is passed, so an empty box doesn't wipe an
  existing remark), plus `updatedAt`.
- `reactivateVideo(id)` — `updateDoc` setting `status: ACTIVE`, `rejectedAt: null`,
  `updatedAt`.
- Remarks-only edits reuse `updateVideoMeta(id, { remarks })`.

## UI

### `src/pages/Videos/ui.js`
- Add `VIDEO_STATUS_META[VIDEO_STATUS.REJECTED]` with a red palette
  (e.g. `label: "Rejected"`, `color: "#b3261e"`, `bg: "rgba(179,38,30,0.12)"`).

### `src/pages/Videos/VideoDetail.jsx`
- **Reject / Reactivate action** in the top action bar (alongside Edit/Delete):
  - When `status !== REJECTED`: a "Reject" affordance opening a reject **bottom
    sheet** (reuse the existing `SlideUp` pattern) with an optional remarks
    TextField (prefilled from current `remarks`) and a confirm button. Confirm →
    `rejectVideo`.
  - When `status === REJECTED`: a "Reactivate" button → `reactivateVideo`.
- **Status chip** uses `VIDEO_STATUS_META[video.status]`, so a rejected video shows
  the red chip.
- **Remarks section** at the bottom of the page:
  - No remark + not editing → an "Add remarks" text button.
  - Editing → TextField (multiline) + Save / Cancel; Save → `updateVideoMeta`.
  - Remark present, not editing → the remark text with an edit affordance that
    reopens the TextField.

### `src/pages/Videos/index.jsx` (dashboard)
- `isDoneVideo(v)` returns true for `COMPLETED` **or** `REJECTED`, so rejected
  videos appear in the Done tab.

### `src/pages/Videos/components/VideoCard.jsx`
- When `status === REJECTED`: light-red tinted background + a small "Rejected" chip,
  mirroring the existing green done-card branch. Rejected takes precedence over the
  step-progress `isDone` styling.

## Out of scope / non-goals
- No remark history/audit thread.
- No change to the 7-step pipeline behaviour.
- No `on_hold` status work (already present in metadata, unused here).

## Testing
Per repo convention, no tests unless the logic warrants it. The new firebase
helpers are thin `updateDoc` wrappers; existing `videoWorkflow` unit tests stay
green (only an added enum value).

## Versioning
Bump `package.json` minor (new feature): 1.17.2 → 1.18.0.

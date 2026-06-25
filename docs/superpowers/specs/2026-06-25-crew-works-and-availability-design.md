# Crew "Your works" + works collection restructure + availability fix

Date: 2026-06-25
Branch: feature/video-tracking

## Goals

1. **`/crew` "Your works"** — show the logged-in crew member their open (not-done) assigned works.
2. **Restructure video steps** from an embedded `stages[]` array on each video into a
   top-level **`works`** collection (Option B), so a member's works can be queried
   directly instead of scanning every video.
3. **Fix the availability bug** — Firestore `available: false` currently shows as
   "Available" on `/crew`.

## Data model

### `videos/{id}` — metadata + cheap rollup (no embedded steps)
```
{ title, status, doneCount, createdAt, updatedAt, createdBy }
```
- `status`: `"active"` | `"completed"` (completed when `doneCount === VIDEO_STEPS.length`).
- `doneCount`: number of this video's work docs with `status === "done"`.
- The 7 step names / order / skills live in code (`videoSteps.js`), never in Firestore.

### `works/{videoId_stageId}` — one doc per *touched* step (lazy)
```
{ videoId, stageId, assigneeId, status, note, completedAt }
```
- Deterministic ID `${videoId}_${stageId}` → one work per step, idempotent upsert,
  readable by ID inside a transaction (web SDK can't query in a transaction).
- Created only when a step is assigned / started. Untouched steps have **no doc**
  and render as "pending / unassigned" purely from `VIDEO_STEPS`.
- A work that returns to pending **with no assignee and no note** is deleted, to stay lean.
- `name`, `order`, `assigneeName`, `updatedAt`, `updatedBy` are **not stored**
  (name/order from code; assigneeName resolved from the crew list; audit dropped).

### `videoCrew/{email}` — unchanged
`{ name, skills, available, ... }`

## Correctness of `doneCount`

All work writes go through one function `updateWork()`:
1. Transaction reads the video doc + all 7 work refs (by known IDs).
2. Applies the change to the one target work.
3. **Recomputes `doneCount` from scratch** (absolute count, never `±1`) → self-healing.
4. Writes the work doc (or deletes it if empty) + video `doneCount`/`status` atomically.

## Queries

- **Your works:** `where("assigneeId","==", crew.id)` on `works`, filter
  `status !== "done"` client-side (single-field index, no composite). Then fetch the
  distinct videos for their titles. Live via `onSnapshot`.
- **Video timeline:** `where("videoId","==", id)` on `works`, merged over `VIDEO_STEPS`
  in code. Live via `onSnapshot`.
- **Videos list:** `listVideos()` unchanged; progress from `doneCount` (no works read).

## Code changes

- **`src/firebase/video/works.js`** (new): `workId`, `subscribeVideoWorks`,
  `subscribeMyWorks`, `updateWork` (transactional recompute), `migrateVideosToWorks`.
- **`src/firebase/video/videos.js`**: `addVideo` drops `stages`, sets `doneCount: 0`;
  remove `updateVideoStage`; `deleteVideo` also deletes the video's work docs.
- **`src/utils/videoWorkflow.js`**: drop `buildStagesFromList`; add `mergeStepsWithWorks`;
  `progress` reads `doneCount` with a legacy `stages[]` fallback.
- **`src/utils/videoSteps.js`**: unchanged (already hardcoded).
- **`src/pages/Videos/VideoForm.jsx`**: create video without stages.
- **`src/pages/Videos/VideoDetail.jsx`**: subscribe to works + video; build merged steps
  (resolve assigneeName from crew); call `updateWork`.
- **`src/pages/Videos/components/StageTimeline.jsx`**: unchanged (consumes merged steps).
- **`src/pages/Videos/components/VideoCard.jsx`**: progress from `doneCount`.
- **`src/pages/CrewHome/index.jsx`**: fix availability (`useEffect` sync); real
  "Your works" section (open works + video titles + step names).

## Migration

`migrateVideosToWorks()`: for each video with a legacy `stages[]`, create a work doc for
each non-pending stage, set `doneCount`, and remove the `stages` field. Triggered once by
the owner from the Video Config page (temporary button, removed after running). Few videos
exist, so this is safe and one-shot.

## Out of scope

- Auto-deriving availability from assigned works (the `hasAssignedWork` idea) — keep the
  manual toggle for now.
- No Firebase Auth changes; admin-code flow untouched.

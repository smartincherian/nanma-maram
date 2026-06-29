# Video Pipeline Simplification — Design

Date: 2026-06-23
Branch: feature/video-tracking

## Goal

Reduce the number of interactions needed to move a video through production, and
remove the conceptual confusion between "Skills" and "Video Types".

## Changes

### 1. Auto-advancing pipeline (one rule)

A single pure helper drives all stage status:

> **The first not-done stage is `in_progress`; every stage after it is `pending`;
> `done` stages stay `done`.**

Implemented as `advancePipeline(stages)` in `src/utils/videoWorkflow.js` and applied
in three places:

- **On create** — `buildStagesForType` returns stages already normalized, so the
  first stage is `in_progress` (was: all `pending`).
- **On "Mark complete"** — the stage is set to `done`, then `advancePipeline` re-runs,
  so the next stage automatically becomes `in_progress`.
- **On reopen/correction** — `advancePipeline` re-runs, so the earliest unfinished
  stage becomes the active one again and later stages return to `pending`.

When the last stage is completed there is no remaining not-done stage, so no stage is
`in_progress` and the existing `deriveStatus` marks the video `completed`.

`advancePipeline` definition:

```js
export const advancePipeline = (stages = []) => {
  let activated = false;
  return stages.map((s) => {
    if (s.status === STAGE_STATUS.DONE) return s;
    if (!activated) {
      activated = true;
      return { ...s, status: STAGE_STATUS.IN_PROGRESS };
    }
    return { ...s, status: STAGE_STATUS.PENDING };
  });
};
```

### 2. One-tap completion in the data layer

`updateVideoStage(videoId, stageId, patch, adminEmail)` continues to apply the patch
to the matching stage (status/assignee/note + `completedAt` bookkeeping), then runs
`advancePipeline` on the resulting array before computing `deriveStatus`. The
"Mark complete" button simply calls it with `{ status: "done" }`.

### 3. Timeline UI

`StageTimeline` / `VideoDetail`:

- **Primary:** a prominent **"Mark complete"** button shown only on the active
  (`in_progress`) stage.
- **Secondary:** a small **"Edit"** link on each stage opening a slimmed dialog with
  **Assignee** + **Note/link**, plus a **"Reopen stage"** action on `done` stages.
- The old Pending / In-progress / Done **status dropdown is removed** — status is now
  driven by the Complete button and the rule.

### 4. Rename "Video Types" → "Workflows"

UI-label only. Tab label, page subtitle, button text, dialog titles/fields, snackbars
and the New Video form all say "Workflow". Skills stay informational chips. Firestore
collection (`videoTypes`) and document fields (`typeId`, `typeName`) are unchanged —
no data migration.

## Edge cases

- Video with no stages → `advancePipeline` returns `[]`, `deriveStatus` keeps it active.
- Completing the last stage → video becomes `completed`.
- Reopening a done stage → it becomes active, later stages return to `pending`.

## Files

- `src/utils/videoWorkflow.js` (+ `videoWorkflow.test.js`)
- `src/firebase/video/videos.js` (+ `videos.test.js`)
- `src/pages/Videos/components/StageTimeline.jsx`
- `src/pages/Videos/VideoDetail.jsx`
- `src/pages/VideoConfig/index.jsx`, `TypesTab.jsx`, `StagesTab.jsx`, `CrewTab.jsx`
- `src/pages/Videos/VideoForm.jsx`
- `package.json` (version bump)

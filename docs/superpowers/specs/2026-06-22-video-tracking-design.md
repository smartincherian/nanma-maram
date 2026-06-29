# Video Tracking — Design

Status: Approved 2026-06-22

## 1. Purpose

Add a video-production pipeline tracker to the Nanma Maram admin app. A set of
logged-in admins create videos, assign production crew to each stage of work,
and update status. Leaders can see the stage every video is at, and which crew
members are busy vs free.

## 2. Locked decisions

- A **video** has a **type** (Short / Long / Promo). The type defines an ordered
  list of **stages**.
- **Stages** (e.g. Source → Check → Edit → Poster → Thumbnail → Upload) are
  leader-configurable in-app.
- Each stage of a video is **independently assigned** to one **crew member**,
  with its own status (Pending / In progress / Done), completion timestamp, and
  optional note/link (e.g. YouTube URL on Upload).
- **Crew** is a separate managed list (name + skills + optional linked admin
  email). Crew need not log in; they are assignable resources.
- **Owners** (existing `role: "owner"` admins) manage configuration (stages,
  types, skills, crew). **Any admin** operates (adds videos, assigns crew,
  updates status). No new role system.
- Dashboard surfaces **both** a video board (stage at a glance) and a **crew
  workload** view (busy / free).
- Videos carry an optional **target date** and **priority** (Normal / High).
- **"Busy"** = a crew member assigned to any *non-Done* stage on an *active*
  video.

## 3. Data model (Firestore — new collections)

Reuses the shared `DB` instance from `src/config/firebase.js`. Follows the
existing snapshot-name pattern so renaming/deleting config never corrupts
historical videos.

| Collection | Key fields |
|---|---|
| `videoStages` | `name`, `order`, `createdAt` — master stage list (owner-managed, reorderable) |
| `videoSkills` | `name`, `createdAt` — "types of work" vocabulary (Short, Long, Poster, Thumbnail, Promo) |
| `videoTypes` | `name`, `stageIds[]` (ordered → the pipeline), `createdAt` |
| `videoCrew` | `name`, `skills[]` (skill ids), `linkedEmail?`, `active`, `createdAt` |
| `videos` | `title`, `typeId` + `typeName`, `status` (`active`/`completed`/`on_hold`), `priority` (`normal`/`high`), `targetDate?`, `sourceLink?`, `createdBy`, `createdAt`, `updatedAt`, `stages[]` |

Each embedded entry in `videos.stages[]`:

```
{
  stageId, name, order,
  assigneeId | null, assigneeName | null,
  status: "pending" | "in_progress" | "done",
  note?,            // e.g. YouTube URL on Upload
  completedAt | null,
  updatedBy, updatedAt
}
```

Stages are **embedded** in the video doc (bounded count, atomic reads, the
timeline view needs them together) and **snapshotted** from the type's pipeline
at creation, so later config edits don't mutate in-flight videos. Names of
stage/crew are snapshotted for the same reason.

## 4. Firebase module layer (`src/firebase/video/`)

Mirrors `src/firebase/admins/index.js`.

- `stages.js` — list / add / update / delete / reorder stages.
- `skills.js` — list / add / update / delete skills.
- `types.js` — list / add / update / delete types (with ordered `stageIds`).
- `crew.js` — list / add / update / delete crew.
- `videos.js`:
  - `listVideos(filters)` / `getVideo(id)` / `subscribeVideo(id, cb)` (`onSnapshot`).
  - `addVideo(input, stagesById)` — builds `stages[]` from the chosen type.
  - `updateStage(videoId, stageId, patch, adminEmail)` — **Firestore transaction**:
    update the stage in the array, recompute video `status` (completed when all
    stages done), set `completedAt` when a stage moves to done, stamp
    `updatedBy`/`updatedAt`. Same atomic pattern as `addCounter`.
  - `updateVideoMeta(id, patch)` / `deleteVideo(id)`.

## 5. Pure utilities (`src/utils/videoWorkflow.js`, unit-tested)

- `buildStagesForType(type, stagesById)` → ordered `stages[]` for a new video.
- `computeCrewWorkload(videos, crew)` → per person: **Busy** (assigned to any
  non-Done stage on an active video, with the list of those videos/stages) vs
  **Free**.
- Helpers: `currentStage(video)`, `progress(video)` (`done/total`),
  `deriveStatus(stages)`.

## 6. Routes & screens (added to `src/App.js`, under `ProtectedRoute`)

| Path | Screen | Access |
|---|---|---|
| `/videos` | **Dashboard** — tabs: *Videos board* + *Team workload* | any admin |
| `/videos/new`, `/videos/:id/edit` | **VideoForm** | any admin |
| `/videos/:id` | **VideoDetail** — timeline + per-stage update | any admin |
| `/video-config` | **VideoConfig** — tabs: Stages / Types / Skills / Crew | **owner only** |

Plus a **"Video Tracking"** card on Home → `/videos`, and an owner-only
"Manage" entry inside the dashboard → `/video-config`.

### Screen detail

- **VideoDetail timeline**: vertical stepper matching the reference screenshot —
  done = green dot + connector, in-progress = amber, pending = grey. Each row:
  stage name, assignee, status, completion timestamp, note. Inline actions:
  Start / Mark done / Reassign (opens a small dialog; writes via `updateStage`).
- **Board tab**: video cards with type, priority, target date, a compact
  `Edit • 3/6` progress chip, current pending stage + assignee. Filter chips
  (type, status, assignee, priority).
- **Team tab**: crew list with Busy/Free chip + what each is on; filter by
  skill; "free only" toggle. Driven by `computeCrewWorkload`.
- **VideoForm**: title, type (select), priority, target date
  (`@mui/x-date-pickers`, already a dependency), optional source link; optional
  pre-assign crew per stage. On create, builds `stages[]` from the type.
- **VideoConfig** (owner-only, tabs, each a CRUD list like `Admins`):
  - *Stages*: CRUD + reorder (up/down buttons).
  - *Types*: CRUD; edit name + ordered selection of stages.
  - *Skills*: CRUD list.
  - *Crew*: CRUD (name, skills multi-select, optional linked admin email,
    active toggle).
- **CrewPicker** component: select filtered by matching skill (soft suggestion,
  not enforced).

UI uses the existing warm amber/blue MUI theme, `SnackbarContext` toasts, and
confirmation dialogs for deletes — consistent with the `Admins` page.

## 7. Permissions, error handling, edge cases

- Config routes/components gate on `isOwner` from `useAuth`; non-owners don't
  see the Manage entry. Same client-side trust model the app already uses.
- **Known limitation / follow-up**: the app currently has no Firestore security
  rules; these collections inherit that. Adding rules to restrict writes to
  admins/owners is recommended but not a v1 blocker.
- Deletes use confirmation dialogs. Because videos snapshot names, deleting a
  stage/skill/crew won't corrupt existing videos (a removed crew member shows as
  a retained snapshot name). Deleting a stage also removes it from
  `videoTypes.stageIds`.
- All failures surface via Snackbar (existing pattern).

## 8. Testing (existing Jest / RTL + CRA)

- Unit tests for firebase modules (mock Firestore as in
  `admins/index.test.js`).
- Unit tests for the pure utils (`buildStagesForType`, `computeCrewWorkload`,
  status helpers).
- Component tests for config CRUD and the stage-update flow.

## 9. Build phases

1. Firebase modules + owner config screens (Stages / Skills / Types / Crew),
   with an optional one-time seed util for the 6 stages, 3 types, 5 skills, and
   34 crew.
2. Video create-from-type + detail timeline + transactional stage updates.
3. Dashboard board (filters) + Team workload tab.
4. Home entry, polish, tests, `package.json` version bump.

## 10. Seed data (optional one-time util)

- Stages: Source Video, Video Check, Edit, Poster, Thumbnail, YouTube Upload.
- Skills: Short Video, Long Video, Poster, Thumbnail, Promo.
- Types: Short (Source → Check → Edit → Thumbnail → Upload),
  Long (Source → Check → Edit → Thumbnail → Upload),
  Promo (Source → Check → Edit → Poster → Thumbnail → Upload).
- Crew: the 34 listed names with their stated skills.

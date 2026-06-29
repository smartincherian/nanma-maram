# Video Tracking Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A video-production pipeline tracker where admins create videos, assign crew per stage, update status on a timeline, and view crew workload.

**Architecture:** Firestore-only (no backend), reusing the existing Google-auth admin allowlist. New `video*` collections; pure logic in `utils/videoWorkflow.js`; firebase modules in `firebase/video/`; pages under `/videos` and `/video-config`. Owners manage config; any admin operates.

**Tech Stack:** React 18 (CRA), MUI v5, `react-hook-form`, `@mui/x-date-pickers`, Firestore, Jest + RTL.

## Global Constraints

- Reuse `DB`/`AUTH` from `src/config/firebase.js`. No new Firebase apps.
- Match existing UI: warm amber/blue MUI theme, `SnackbarContext` toasts, confirmation dialogs for deletes (mirror `src/pages/Admins/index.jsx`).
- Snapshot stage/crew/type names onto `videos` docs so config edits never mutate in-flight videos.
- Config (write to `videoStages`/`videoSkills`/`videoTypes`/`videoCrew`) is owner-only in UI (`isOwner`). Operating (`videos`) is any admin.
- Bump `package.json` version (minor) at the end via `npm version minor --no-git-tag-version`.

---

### Task 1: Pure workflow utilities + tests

**Files:**
- Create: `src/utils/videoWorkflow.js`
- Test: `src/utils/videoWorkflow.test.js`

**Interfaces — Produces:**
- `STAGE_STATUS = { PENDING:"pending", IN_PROGRESS:"in_progress", DONE:"done" }`
- `VIDEO_STATUS = { ACTIVE:"active", COMPLETED:"completed", ON_HOLD:"on_hold" }`
- `buildStagesForType(type, stagesById)` → ordered `stages[]` (each `{stageId,name,order,assigneeId:null,assigneeName:null,status:"pending",note:"",completedAt:null}`)
- `deriveStatus(stages)` → `"completed"` if all done, else `"active"`
- `progress(video)` → `{done, total}`
- `currentStage(video)` → first non-done stage (or null)
- `computeCrewWorkload(videos, crew)` → `[{...crewMember, busy:boolean, assignments:[{videoId,videoTitle,stageName,status}]}]` (busy = assigned to any non-done stage on an active video)

- [ ] **Step 1:** Write `src/utils/videoWorkflow.test.js` covering: `buildStagesForType` orders by `type.stageIds` and pulls names from `stagesById`; `deriveStatus` returns completed only when every stage done; `progress` counts done/total; `currentStage` returns first non-done; `computeCrewWorkload` marks a crew member busy when assigned to a non-done stage on an active video and free otherwise (and ignores completed videos).
- [ ] **Step 2:** Run `npm test -- --watchAll=false --testPathPattern=videoWorkflow` → FAIL.
- [ ] **Step 3:** Implement `src/utils/videoWorkflow.js` to satisfy the tests.
- [ ] **Step 4:** Run the test → PASS.
- [ ] **Step 5:** Commit `feat: video workflow pure utilities`.

---

### Task 2: Firebase config modules (stages, skills, types, crew) + tests

**Files:**
- Create: `src/firebase/video/stages.js`, `src/firebase/video/skills.js`, `src/firebase/video/types.js`, `src/firebase/video/crew.js`
- Test: `src/firebase/video/stages.test.js` (representative; mock Firestore as in `src/firebase/admins/index.test.js`)

**Interfaces — Produces (each mirrors admins CRUD):**
- stages: `listStages()`, `addStage({name})`, `updateStage(id,{name})`, `deleteStage(id)`, `reorderStages(orderedIds)`
- skills: `listSkills()`, `addSkill({name})`, `updateSkill(id,{name})`, `deleteSkill(id)`
- types: `listTypes()`, `addType({name,stageIds})`, `updateType(id,{name,stageIds})`, `deleteType(id)`
- crew: `listCrew()`, `addCrew({name,skills,linkedEmail})`, `updateCrew(id,{name,skills,linkedEmail,active})`, `deleteCrew(id)`

Collections: `videoStages`, `videoSkills`, `videoTypes`, `videoCrew`. Auto-id docs (`addDoc`). `listStages` sorts by `order` then `createdAt`; others sort by `createdAt`. `reorderStages` writes new `order` per id (batch). `deleteStage` also strips the id from every `videoTypes.stageIds`.

- [ ] **Step 1:** Write `stages.test.js` mocking `firebase/firestore` — assert `addStage` calls `addDoc` with `{name, order, createdAt}` and `listStages` maps `{id,...data}` sorted by order.
- [ ] **Step 2:** Run `npm test -- --watchAll=false --testPathPattern=video/stages` → FAIL.
- [ ] **Step 3:** Implement the four modules following `src/firebase/admins/index.js` style.
- [ ] **Step 4:** Run the test → PASS.
- [ ] **Step 5:** Commit `feat: video config firebase modules`.

---

### Task 3: Firebase videos module + tests

**Files:**
- Create: `src/firebase/video/videos.js`
- Test: `src/firebase/video/videos.test.js`

**Interfaces — Produces:**
- `listVideos()` → all videos (sorted: active first, then by createdAt desc)
- `getVideo(id)`, `subscribeVideo(id, cb)` (returns unsubscribe; uses `onSnapshot`)
- `addVideo({title,typeId,typeName,priority,targetDate,sourceLink,stages,createdBy})` → builds doc with `status:"active"`, `createdAt`, `updatedAt`
- `updateStage(videoId, stageId, patch, adminEmail)` — **transaction**: read video, replace matching stage with `{...stage,...patch,updatedBy:adminEmail,updatedAt}`, set `completedAt` when status→done (clear when leaving done), recompute `status` via `deriveStatus`, write back.
- `updateVideoMeta(id, patch)`, `deleteVideo(id)`

- [ ] **Step 1:** Write `videos.test.js` mocking firestore `runTransaction` — assert `updateStage` sets `completedAt` and flips video `status` to completed when the last stage becomes done.
- [ ] **Step 2:** Run `npm test -- --watchAll=false --testPathPattern=video/videos` → FAIL.
- [ ] **Step 3:** Implement `videos.js` (import `deriveStatus`, `STAGE_STATUS` from `utils/videoWorkflow`).
- [ ] **Step 4:** Run the test → PASS.
- [ ] **Step 5:** Commit `feat: videos firebase module with transactional stage updates`.

---

### Task 4: Seed util (optional one-time)

**Files:**
- Create: `src/firebase/video/seed.js`

**Interfaces — Produces:** `seedVideoData()` — idempotent-ish: only seeds a collection if empty. Stages, Skills, Types, and the 34 crew from the spec §10. Exposed via an owner-only "Seed sample data" button in VideoConfig (Crew tab), guarded by a confirm dialog.

- [ ] **Step 1:** Implement `seed.js` building the documents from spec §10 (skills first, then stages, then types referencing stage ids, then crew referencing skill ids).
- [ ] **Step 2:** Commit `feat: video seed util`.

---

### Task 5: Routing + Home entry

**Files:**
- Modify: `src/App.js` (add routes), `src/pages/Home/index.jsx` (add menu card)
- Create: page stubs so routes resolve (filled in later tasks)

Routes (all wrapped in `ProtectedRoute`): `/videos` (Dashboard), `/videos/new` + `/videos/:id/edit` (VideoForm), `/videos/:id` (VideoDetail), `/video-config` (VideoConfig). Home card: text "Video Tracking", helper "Track video production stages & crew", icon `MovieFilterIcon`, path `/videos`.

- [ ] **Step 1:** Add the four imports + routes to `App.js` and the menu item to `Home`.
- [ ] **Step 2:** Create minimal default-export stubs for the four pages.
- [ ] **Step 3:** Run `npm test -- --watchAll=false --testPathPattern=Home` → PASS (existing test still green).
- [ ] **Step 4:** Commit `feat: video tracking routes and home entry`.

---

### Task 6: VideoConfig page (owner-only) — Stages/Skills/Types/Crew tabs

**Files:**
- Create: `src/pages/VideoConfig/index.jsx`, `StagesTab.jsx`, `SkillsTab.jsx`, `TypesTab.jsx`, `CrewTab.jsx`

Each tab mirrors `src/pages/Admins/index.jsx`: list + add/edit dialog + delete confirm + Snackbar. Page guards on `isOwner` (non-owner → message + back to `/videos`). StagesTab adds up/down reorder buttons (calls `reorderStages`). TypesTab edit dialog: name + ordered multi-select of stages (checkbox list with up/down). CrewTab: name, skills multi-select (from `listSkills`), optional linked email, active toggle; plus "Seed sample data" button.

- [ ] **Step 1:** Build `index.jsx` with MUI `Tabs` + `isOwner` guard + back button.
- [ ] **Step 2:** Build `SkillsTab` (simplest CRUD) and verify in browser-less render test.
- [ ] **Step 3:** Build `StagesTab` (CRUD + reorder).
- [ ] **Step 4:** Build `TypesTab` (CRUD + ordered stage selection).
- [ ] **Step 5:** Build `CrewTab` (CRUD + skills select + seed button).
- [ ] **Step 6:** Commit `feat: video config management screens`.

---

### Task 7: VideoForm (create/edit)

**Files:**
- Create: `src/pages/Videos/VideoForm.jsx`
- Create: `src/pages/Videos/components/CrewPicker.jsx`

`react-hook-form`. Fields: title, type (select from `listTypes`), priority (Normal/High), target date (`@mui/x-date-pickers` `DatePicker` + `dayjs`), optional source link. On create: fetch stages, `buildStagesForType`, optional per-stage `CrewPicker` pre-assign, then `addVideo` with `createdBy = user.email`. Edit mode (`:id`): load via `getVideo`, edit meta only (stages edited on detail page), `updateVideoMeta`. CrewPicker filters crew by a stage's matching skill but allows any.

- [ ] **Step 1:** Build `CrewPicker` (Autocomplete/Select over active crew, optional `skillFilter`).
- [ ] **Step 2:** Build create mode; navigate to `/videos/:id` on success.
- [ ] **Step 3:** Add edit mode (meta only).
- [ ] **Step 4:** Commit `feat: video create/edit form`.

---

### Task 8: VideoDetail timeline + per-stage updates

**Files:**
- Create: `src/pages/Videos/VideoDetail.jsx`
- Create: `src/pages/Videos/components/StageTimeline.jsx`, `src/pages/Videos/components/StatusChip.jsx`

`subscribeVideo` for live data. `StageTimeline`: vertical timeline matching the reference screenshot — done = green dot + filled connector, in_progress = amber, pending = grey. Each row: stage name, assignee, `StatusChip`, completion timestamp (`dayjs` format), note. Row actions open a small dialog to set assignee (`CrewPicker`), status, and note → `updateStage(videoId, stageId, patch, user.email)`. Header shows title, type, priority, target date, `progress` chip, and Edit (meta)/Delete buttons.

- [ ] **Step 1:** Build `StatusChip` (maps status→color/label).
- [ ] **Step 2:** Build `StageTimeline` (presentational, takes stages + onEditStage).
- [ ] **Step 3:** Build `VideoDetail` wiring subscribe + update dialog + delete confirm.
- [ ] **Step 4:** Commit `feat: video detail timeline with stage updates`.

---

### Task 9: Dashboard — Videos board + Team workload tabs

**Files:**
- Create: `src/pages/Videos/index.jsx`
- Create: `src/pages/Videos/components/VideoCard.jsx`, `src/pages/Videos/components/TeamWorkload.jsx`

`Tabs`: "Videos" and "Team". Videos tab: `listVideos`, filter chips (type, status, priority, assignee), `VideoCard` per video (title, type, priority, target date, `Edit • 3/6` progress chip via `progress`, current stage + assignee via `currentStage`) → click to `/videos/:id`; "New video" FAB/button → `/videos/new`. Team tab: `computeCrewWorkload(videos, crew)` → list with Busy/Free chip + assignments, skill filter, "free only" toggle. Owner-only "Manage" button → `/video-config`.

- [ ] **Step 1:** Build `VideoCard`.
- [ ] **Step 2:** Build Videos tab (list + filters + new button + Manage button).
- [ ] **Step 3:** Build `TeamWorkload` + Team tab.
- [ ] **Step 4:** Commit `feat: video dashboard board and team workload`.

---

### Task 10: Polish, build check, version bump

- [ ] **Step 1:** Run `npm test -- --watchAll=false` → all green.
- [ ] **Step 2:** Run `npm run build` → succeeds with no errors.
- [ ] **Step 3:** `npm version minor --no-git-tag-version`.
- [ ] **Step 4:** Commit `chore: bump version for video tracking`.

## Self-Review notes

- Spec coverage: §3 data model → Tasks 2–3; §4 modules → 2–3; §5 utils → 1; §6 routes/screens → 5–9; §7 permissions → 6 (isOwner) + 5 (ProtectedRoute); §8 testing → tests in 1–3; §9 phases → task ordering; §10 seed → 4.
- Busy definition consistent (non-done stage on active video) across util + Team tab.
- Name consistency: `updateStage` (firebase, transactional) vs the config `updateStage` in `stages.js` — disambiguated by module path (`firebase/video/videos` vs `firebase/video/stages`); import with explicit names where both are needed.

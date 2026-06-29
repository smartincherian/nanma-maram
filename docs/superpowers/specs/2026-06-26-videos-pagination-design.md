# Videos pagination — design

**Date:** 2026-06-26
**Status:** Approved
**Page:** `/videos` (`src/pages/Videos/index.jsx`)

## Problem

`/videos` loads via `listVideos()`, which reads **every** document in the
`videos` collection (`getDocs(collection(DB, "videos"))`), sorts client-side
(active-first, then `createdAt` desc), and the page splits the result into
**Active** vs **Done** tabs in memory.

The collection grows without bound — completed and rejected videos accumulate
forever in the **Done** tab. Reading the whole collection on every visit is
getting slow and expensive. We want to read only one page at a time from
Firestore (server-side cursor pagination).

## Goal

Server-side cursor pagination so each visit (and each "Load more") reads at most
one page of documents, not the entire collection.

## Status model

`VIDEO_STATUS` (in `src/utils/videoWorkflow.js`) has exactly three values:
`active`, `completed`, `rejected`. The two tabs map cleanly:

| Tab | Query filter |
|-----|--------------|
| Active (`filter === "pending"`) | `status == "active"` |
| Done (`filter === "done"`) | `status in ["completed", "rejected"]` |

The **Active** tab is naturally bounded (work-in-progress). The **Done** tab is
the unbounded one — the real pagination target — but both tabs use the same
mechanism for uniformity.

Splitting the list per-tab on the server removes the need for the old
client-side composite "active-first" sort: within each tab the order is simply
`createdAt desc`.

## UI pattern

**"Load more" button.** Show the first page of cards; tapping "Load more"
fetches and appends the next page using a Firestore `startAfter` cursor. Cheap,
mobile-friendly, no count reads. (Arbitrary page jumps are not supported — not
needed here.)

## Design

### 1. Data layer — `src/firebase/video/videos.js`

Replace `listVideos()` with a paged query:

```js
listVideosPage({ filter, pageSize, cursor })
  → { videos, cursor: lastSnapshot, hasMore }
```

- Build the base query from `filter`:
  - `"pending"` → `where("status", "==", "active")`
  - `"done"` → `where("status", "in", ["completed", "rejected"])`
- Always `orderBy("createdAt", "desc")`, `limit(pageSize + 1)`.
- When a `cursor` (a `DocumentSnapshot`) is supplied, add `startAfter(cursor)`.
- Run one-shot `getDocs` (matches today's behaviour — not `onSnapshot`).
- From the snapshot:
  - `hasMore = snapshot.docs.length > pageSize`
  - take the first `pageSize` docs as `videos`
    (`{ id, ...data }`)
  - `cursor` = the `DocumentSnapshot` of the last **returned** doc
    (`snapshot.docs[returned.length - 1]`), or `null` if empty — this is the
    value the caller passes back as `cursor` for the next page.

The `pageSize + 1` fetch is how we know whether a further page exists without an
extra count read; it also avoids a phantom "Load more" that would fetch an empty
page.

Delete the now-unused `sortVideos` helper. `getVideo`, `subscribeVideo`,
`addVideo`, `updateVideoMeta`, `rejectVideo`, `reactivateVideo`, `deleteVideo`
are unchanged.

### 2. Page — `src/pages/Videos/index.jsx`

- Add `const PAGE_SIZE = 15;`.
- State: `videos`, `hasMore`, `loadingInitial`, `loadingMore`. The cursor is held
  in a `useRef` (it's a Firestore snapshot, not render state).
- On mount **and whenever `filter` changes**: reset `videos = []`, clear the
  cursor ref, set `loadingInitial`, and fetch the first page via
  `listVideosPage({ filter, pageSize: PAGE_SIZE, cursor: null })`. Guard against
  stale async responses (the existing `active` flag pattern, keyed so a tab
  switch discards an in-flight previous-tab response).
- Remove the in-memory `filteredVideos` computation — the server query now does
  the filtering.
- "Load more": rendered under the card stack whenever `hasMore`. On click, set
  `loadingMore`, call `listVideosPage` with the stored cursor, append the new
  `videos`, update `hasMore` and the cursor ref, clear `loadingMore`. Show a
  small spinner in the button while loading.
- Empty-state, the floating "New" FAB, the header row, and the Active/Done
  toggle are unchanged.

### 3. One-time setup (manual)

`firebase.json` configures only Hosting; there is no tracked
`firestore.indexes.json`. These queries need a composite index on the `videos`
collection: **`status` ASC, `createdAt` DESC**. Firestore returns a console link
in the error the first time the query runs — follow it to create the index.
(One index serves both the `==` and the `in` variants.)

## Trade-offs (intentional)

- **No real-time updates.** Already true today (`getDocs`, not `onSnapshot`). A
  newly added or status-changed video appears on the next visit or tab toggle,
  not live. Acceptable; not a regression.
- **Docs missing `createdAt` are excluded** by `orderBy("createdAt")`. `addVideo`
  always sets `createdAt: serverTimestamp()`, so this only affects hand-created
  docs.

## Out of scope

- Real-time/live list updates.
- Numbered pages or infinite scroll.
- Pagination of any other collection (crew, works).
- Versioning bump and changelog happen during implementation, not in this spec.

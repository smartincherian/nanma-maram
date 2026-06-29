# Videos Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paginate the `/videos` page with Firestore cursor pagination so each visit and each "Load more" reads at most one page instead of the whole collection.

**Architecture:** Replace the read-everything `listVideos()` with a paged `listVideosPage({ filter, pageSize, cursor })` that runs a server-side `where(status) + orderBy(createdAt desc) + limit` query and returns the page, a resume cursor (a Firestore `DocumentSnapshot`), and a `hasMore` flag. The page tracks the cursor in a ref and appends pages on a "Load more" button. Per-tab server filtering removes the old client-side composite sort.

**Tech Stack:** React 18 (CRA), Firebase Firestore v9 modular SDK, Material UI v5, Jest (CRA preset).

## Global Constraints

- Bump `version` in `package.json` for this feature — minor bump (`1.19.0` → `1.20.0`) via `npm version minor --no-git-tag-version`. Surfaced in the footer via `REACT_APP_VERSION`.
- `VIDEO_STATUS` values (from `src/utils/videoWorkflow.js`): `active`, `completed`, `rejected`. Active tab = `status == "active"`; Done tab = `status in ["completed", "rejected"]`.
- Page size: `PAGE_SIZE = 15`.
- One-time manual setup (NOT code): a Firestore composite index on `videos` — `status ASC, createdAt DESC`. Firestore returns a console link the first time the query runs; follow it. Mention this to the user at the end.
- Keep one-shot `getDocs` (no `onSnapshot`) — matches current behaviour; live updates are out of scope.
- Follow existing data-layer test style (`src/firebase/video/works.test.js`): mock `firebase/firestore` and `../../config/firebase`.

---

### Task 1: Data layer — `listVideosPage`

**Files:**
- Modify: `src/firebase/video/videos.js`
- Test: `src/firebase/video/videos.test.js` (create)

**Interfaces:**
- Consumes: `DB` from `src/config/firebase`; `VIDEO_STATUS` from `src/utils/videoWorkflow`.
- Produces:
  ```js
  listVideosPage({ filter, pageSize, cursor = null })
    → Promise<{
        videos: Array<{ id: string, ...data }>,  // up to pageSize, newest first
        cursor: DocumentSnapshot | null,          // pass back as `cursor` for next page
        hasMore: boolean,
      }>
  ```
  `filter` is `"pending"` (→ `status == "active"`) or `"done"` (→ `status in ["completed","rejected"]`).
- Removes the now-unused `listVideos`, `sortVideos`, and `toMillis` (only `sortVideos` used `toMillis`). The Videos page (Task 2) is the only consumer of `listVideos`.

- [ ] **Step 1: Write the failing test**

Create `src/firebase/video/videos.test.js`:

```js
import { getDocs, limit, startAfter, where } from "firebase/firestore";
import { listVideosPage } from "./videos";
import { VIDEO_STATUS } from "../../utils/videoWorkflow";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => "COL"),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn((n) => ({ limit: n })),
  onSnapshot: jest.fn(),
  orderBy: jest.fn((f, d) => ({ orderBy: [f, d] })),
  query: jest.fn((...args) => args),
  serverTimestamp: jest.fn(() => "TS"),
  startAfter: jest.fn((c) => ({ startAfter: c })),
  updateDoc: jest.fn(),
  where: jest.fn((f, op, v) => ({ where: [f, op, v] })),
}));

jest.mock("../../config/firebase", () => ({ DB: { __db: true } }));

// Build a fake Firestore snapshot from a list of { id, ...fields } objects.
const snap = (items) => ({
  docs: items.map((it) => ({ id: it.id, data: () => it })),
});
const mk = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `v${i}`, title: `t${i}` }));

beforeEach(() => jest.clearAllMocks());

describe("listVideosPage", () => {
  it("returns only pageSize videos and hasMore=true when an extra doc is fetched", async () => {
    getDocs.mockResolvedValue(snap(mk(4))); // pageSize 3 → fetches 4
    const res = await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(res.videos.map((v) => v.id)).toEqual(["v0", "v1", "v2"]);
    expect(res.hasMore).toBe(true);
    expect(limit).toHaveBeenCalledWith(4);
  });

  it("returns all docs and hasMore=false when fewer than pageSize+1 fetched", async () => {
    getDocs.mockResolvedValue(snap(mk(2)));
    const res = await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(res.videos).toHaveLength(2);
    expect(res.hasMore).toBe(false);
  });

  it("cursor is the snapshot of the last returned doc", async () => {
    getDocs.mockResolvedValue(snap(mk(4)));
    const res = await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(res.cursor.id).toBe("v2");
  });

  it("returns a null cursor for an empty page", async () => {
    getDocs.mockResolvedValue(snap([]));
    const res = await listVideosPage({ filter: "done", pageSize: 3 });
    expect(res.videos).toEqual([]);
    expect(res.cursor).toBeNull();
    expect(res.hasMore).toBe(false);
  });

  it("pending filter queries status == active", async () => {
    getDocs.mockResolvedValue(snap([]));
    await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(where).toHaveBeenCalledWith("status", "==", VIDEO_STATUS.ACTIVE);
  });

  it("done filter queries status in [completed, rejected]", async () => {
    getDocs.mockResolvedValue(snap([]));
    await listVideosPage({ filter: "done", pageSize: 3 });
    expect(where).toHaveBeenCalledWith("status", "in", [
      VIDEO_STATUS.COMPLETED,
      VIDEO_STATUS.REJECTED,
    ]);
  });

  it("appends startAfter when a cursor is supplied", async () => {
    getDocs.mockResolvedValue(snap(mk(1)));
    const cursorDoc = { id: "prev" };
    await listVideosPage({ filter: "pending", pageSize: 3, cursor: cursorDoc });
    expect(startAfter).toHaveBeenCalledWith(cursorDoc);
  });

  it("omits startAfter on the first page", async () => {
    getDocs.mockResolvedValue(snap(mk(1)));
    await listVideosPage({ filter: "pending", pageSize: 3 });
    expect(startAfter).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --watchAll=false --testPathPattern=video/videos.test`
Expected: FAIL — `listVideosPage is not a function` (not yet exported).

- [ ] **Step 3: Implement `listVideosPage` and remove the old helpers**

In `src/firebase/video/videos.js`, update the import to add `limit`, `orderBy`, `query`, `startAfter`, `where` (keep the existing names):

```js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
```

Delete the `toMillis` helper (lines ~18-19) and the `sortVideos` helper (lines ~23-32), and replace the `listVideos` export (lines ~34-37) with:

```js
const DONE_STATUSES = [VIDEO_STATUS.COMPLETED, VIDEO_STATUS.REJECTED];

// One page of videos for a tab, newest first. `cursor` is the DocumentSnapshot
// returned by the previous call (null/undefined for the first page). We fetch
// pageSize + 1 docs so we can report hasMore without a separate count read.
export const listVideosPage = async ({ filter, pageSize, cursor = null }) => {
  const statusClause =
    filter === "done"
      ? where("status", "in", DONE_STATUSES)
      : where("status", "==", VIDEO_STATUS.ACTIVE);

  const constraints = [statusClause, orderBy("createdAt", "desc")];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize + 1));

  const snapshot = await getDocs(query(collection(DB, VIDEOS), ...constraints));
  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    videos: pageDocs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: pageDocs.length ? pageDocs[pageDocs.length - 1] : null,
    hasMore,
  };
};
```

(`VIDEOS`, `videoRef`, `getVideo`, `subscribeVideo`, `addVideo`, `updateVideoMeta`, `rejectVideo`, `reactivateVideo`, `deleteVideo` stay as-is.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --watchAll=false --testPathPattern=video/videos.test`
Expected: PASS — all 8 specs green.

- [ ] **Step 5: Commit**

```bash
git add src/firebase/video/videos.js src/firebase/video/videos.test.js
git commit -m "feat: paged listVideosPage cursor query for videos"
```

---

### Task 2: Wire "Load more" into the Videos page

**Files:**
- Modify: `src/pages/Videos/index.jsx`
- Modify: `package.json` (version bump)

**Interfaces:**
- Consumes: `listVideosPage({ filter, pageSize, cursor })` from Task 1.
- Produces: no new exports — the default-exported `VideosDashboard` page now paginates.

No automated test for this task: per `CLAUDE.md` the maintainer verifies UI manually and there is no CI/test gate. Verification is the dev-server check in Step 3.

- [ ] **Step 1: Replace the page component**

Overwrite `src/pages/Videos/index.jsx` with:

```jsx
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useNavigate } from "react-router-dom";
import {
  SnackbarContext,
  SNACK_BAR_SEVERITY_TYPES,
} from "../../components/Snackbar";
import { useAuth } from "../../components/AuthProvider";
import ChapelFooter from "../../components/ChapelFooter";
import { listVideosPage } from "../../firebase/video/videos";
import { amberButtonSx } from "./ui";
import VideoCard from "./components/VideoCard";

const PAGE_SIZE = 15;

const VideosDashboard = () => {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);

  const [videos, setVideos] = useState([]);
  const [filter, setFilter] = useState("pending"); // "pending" | "done"
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef(null);
  // Guards against a slow previous-tab response landing after a tab switch.
  const requestId = useRef(0);

  // (Re)load the first page whenever the tab changes.
  useEffect(() => {
    const id = ++requestId.current;
    setLoadingInitial(true);
    setVideos([]);
    setHasMore(false);
    cursorRef.current = null;
    (async () => {
      try {
        const page = await listVideosPage({ filter, pageSize: PAGE_SIZE });
        if (id !== requestId.current) return;
        setVideos(page.videos);
        cursorRef.current = page.cursor;
        setHasMore(page.hasMore);
      } catch (e) {
        if (id !== requestId.current) return;
        showSnackbar("Could not load videos.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      } finally {
        if (id === requestId.current) setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const page = await listVideosPage({
        filter,
        pageSize: PAGE_SIZE,
        cursor: cursorRef.current,
      });
      setVideos((prev) => [...prev, ...page.videos]);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } catch (e) {
      showSnackbar("Could not load more videos.", SNACK_BAR_SEVERITY_TYPES.ERROR);
    } finally {
      setLoadingMore(false);
    }
  }, [filter, showSnackbar]);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, sm: 5 }, px: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/")} sx={{ textTransform: "none", color: "#6f3a00", fontWeight: 600, minWidth: 0 }}>
          Home
        </Button>
        {isOwner ? (
          <Button startIcon={<GroupsRoundedIcon />} onClick={() => navigate("/video-config")} sx={{ textTransform: "none", fontWeight: 700, color: "#935100", minWidth: 0 }}>
            Crew
          </Button>
        ) : null}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 800, color: "#1f2937", fontSize: { xs: "1.5rem", sm: "2rem" }, minWidth: 0 }}>
          Videos
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(e, next) => {
            if (next) setFilter(next);
          }}
          sx={{
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 700,
              px: 1.75,
              py: 0.4,
              border: "1px solid rgba(160,103,38,0.3)",
              color: "#8a6a36",
              "&.Mui-selected": {
                background: "linear-gradient(135deg, #935100 0%, #d67b1f 100%)",
                color: "#fff",
                "&:hover": { background: "linear-gradient(135deg, #7d4500 0%, #c06d12 100%)" },
              },
            },
          }}
        >
          <ToggleButton value="pending">Active</ToggleButton>
          <ToggleButton
            value="done"
            sx={{
              "&.Mui-selected": {
                background: "linear-gradient(135deg, #2e7d32 0%, #43a047 100%)",
                color: "#fff",
                "&:hover": { background: "linear-gradient(135deg, #256628 0%, #388e3c 100%)" },
              },
            }}
          >
            Done
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loadingInitial ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : videos.length === 0 ? (
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, textAlign: "center", border: "1px dashed rgba(160,103,38,0.3)" }}>
          <Typography sx={{ color: "#8a6a36", mb: 2 }}>
            {filter === "done"
              ? "No completed videos yet."
              : "No active videos — all caught up!"}
          </Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/videos/new")} sx={amberButtonSx}>New video</Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {videos.map((v) => <VideoCard key={v.id} video={v} onOpen={(id) => navigate(`/videos/${id}`)} />)}
          {hasMore ? (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outlined"
              startIcon={loadingMore ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{
                mt: 0.5,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 3,
                color: "#935100",
                borderColor: "rgba(160,103,38,0.4)",
                "&:hover": { borderColor: "#935100", background: "rgba(147,81,0,0.04)" },
              }}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </Stack>
      )}

      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={() => navigate("/videos/new")}
        sx={{
          ...amberButtonSx,
          position: "fixed",
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          py: 1.25,
          px: 2.5,
          boxShadow: "0 10px 24px rgba(147,81,0,0.35)",
          zIndex: 10,
        }}
      >
        New
      </Button>

      <ChapelFooter />
    </Container>
  );
};

export default VideosDashboard;
```

Note the intentional change to the empty state: it no longer distinguishes "No videos yet." (overall empty) from the per-tab message, because server-side filtering no longer loads the whole collection. The message is now purely per-tab.

- [ ] **Step 2: Lint/compile check**

Run: `npm run build`
Expected: build succeeds with no ESLint errors (CRA treats lint errors as build failures). In particular, confirm no "unused variable" errors — `VIDEO_STATUS` is no longer imported here.

- [ ] **Step 3: Manual verification (dev server)**

Run `npm start`, open `/videos`:
- Active and Done tabs each load their first page (≤ 15 cards).
- With > 15 docs in a tab, a "Load more" button appears, appends the next page on click, shows a spinner while loading, and disappears once the last page is reached.
- Switching tabs resets the list and cursor (no leftover cards from the other tab).
- An empty tab shows the correct per-tab message.
- First run will log a Firestore "requires an index" error with a console link — see Step 5.

- [ ] **Step 4: Bump version and commit**

```bash
npm version minor --no-git-tag-version
git add src/pages/Videos/index.jsx package.json package-lock.json
git commit -m "feat: paginate /videos with Load more (v1.20.0)"
```

- [ ] **Step 5: Create the Firestore composite index (manual, one-time)**

The paged queries need a composite index on `videos`: **`status` ASC, `createdAt` DESC**. The simplest path: open `/videos` against production data once and click the console link in the browser-console error Firestore returns, then wait for the index to build. (`firebase.json` configures only Hosting, so there is no `firestore.indexes.json` to edit.) Flag this to the user as a required deploy-time step.

---

## Notes for the implementer

- Firestore v9 modular query building: `query(collectionRef, ...constraints)` where constraints are `where(...)`, `orderBy(...)`, `startAfter(snapshot)`, `limit(n)`. `startAfter` takes the `DocumentSnapshot` of the last item of the previous page — that is exactly what `listVideosPage` returns as `cursor`.
- `orderBy("createdAt")` silently excludes docs missing `createdAt`. `addVideo` always sets it, so real data is unaffected; only hand-created docs would be hidden.

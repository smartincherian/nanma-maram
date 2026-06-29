# Multi-Org Prayer Counters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let outside organizations (Grace Sisters, Jesus Youth) run prayer counters under a neutral `counterprayer.web.app/<org-slug>` URL with zero Nanma Maram branding, each with super-admin-configured text/branding and a code-gated day-wise voter list.

**Architecture:** One Firebase project, one Firestore. Org data shares the existing `intentions` collection (tagged with `orgId`); votes live in a per-org subcollection `orgs/{orgId}/votes`. A second Firebase Hosting site (`counterprayer`) serves the **same** React build; org pages are new `/:orgSlug…` routes that carry org branding and never render `ChapelFooter`.

**Tech Stack:** React 18 (CRA), React Router v6, MUI v5, Firebase Firestore (modular SDK), react-hook-form, Jest (CRA) for the one pure-logic unit test.

## Global Constraints

- **No new Firebase project** — same `nanma-maram` project and Firestore throughout.
- **Data isolation = shared DB tagged by `orgId`.** Existing Nanma Maram intentions have no `orgId` and must never appear in any org view; org intentions must never appear in the main app's lists.
- **Vote log path:** `orgs/{orgId}/votes/{voteId}`, each doc `{ intentionId, voterName, value, timestamp }`.
- **Voter identity:** name typed once, stored in `localStorage` key `orgVoter:<slug>`, auto-attached to every vote. No login for voters.
- **Org admin access:** per-org `adminCode` stored on the org doc, checked client-side (same trust model as the existing `1305`).
- **Text blocks:** configured by super admin only (gated to `SUPERADMIN_EMAILS`). Org admins cannot edit them.
- **No Nanma Maram branding on any org page** — no `ChapelFooter`, no Malayalam default copy. Org pages render org branding only.
- **Tests:** per repo CLAUDE.md, do NOT add test files except the single pure-logic test specified in Task 4. All other tasks verify manually via `npm start`.
- **Versioning:** bump `package.json` version with `npm version minor --no-git-tag-version` in the final task.
- **Git:** stage changes; do NOT commit or push unless the user explicitly asks. The "Commit" steps below stage only — run `git add`, and commit only on the user's go-ahead.

---

### Task 1: Org Firestore module (orgs CRUD + slug lookup)

Creates the data access layer for organizations. No UI yet.

**Files:**
- Create: `src/firebase/org/orgs.js`

**Interfaces:**
- Consumes: `DB` from `src/config/firebase.js`.
- Produces:
  - `listOrgs(): Promise<Org[]>` — all orgs, sorted by `name`.
  - `getOrgBySlug(slug: string): Promise<Org | null>` — single org by `slug`, or `null`.
  - `getOrgById(id: string): Promise<Org | null>`.
  - `createOrg(data: { slug, name, adminCode, primaryColor, textBlocks }): Promise<string>` — returns new doc id.
  - `updateOrg(id: string, data): Promise<void>`.
  - `Org` shape: `{ id, slug, name, adminCode, primaryColor, textBlocks: TextBlock[], createdAt }`.
  - `TextBlock` shape: `{ id, text, variant, color, fontSize, weight, align }`.

- [ ] **Step 1: Write the module**

Create `src/firebase/org/orgs.js`:

```javascript
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "orgs");

const toOrg = (snap) => ({ id: snap.id, ...snap.data() });

export const listOrgs = async () => {
  const snapshot = await getDocs(ref);
  return snapshot.docs
    .map(toOrg)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
};

export const getOrgBySlug = async (slug) => {
  const cleaned = String(slug || "").trim().toLowerCase();
  if (!cleaned) return null;
  const q = query(ref, where("slug", "==", cleaned), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : toOrg(snapshot.docs[0]);
};

export const getOrgById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(ref, id));
  return snap.exists() ? toOrg(snap) : null;
};

export const createOrg = async (data) => {
  const {
    slug = "",
    name = "",
    adminCode = "",
    primaryColor = "#4a148c",
    textBlocks = [],
  } = data || {};
  const created = await addDoc(ref, {
    slug: String(slug).trim().toLowerCase(),
    name: String(name).trim(),
    adminCode: String(adminCode).trim(),
    primaryColor,
    textBlocks: Array.isArray(textBlocks) ? textBlocks : [],
    createdAt: Date.now(),
  });
  return created.id;
};

export const updateOrg = async (id, data) => {
  const {
    slug = "",
    name = "",
    adminCode = "",
    primaryColor = "#4a148c",
    textBlocks = [],
  } = data || {};
  await updateDoc(doc(ref, id), {
    slug: String(slug).trim().toLowerCase(),
    name: String(name).trim(),
    adminCode: String(adminCode).trim(),
    primaryColor,
    textBlocks: Array.isArray(textBlocks) ? textBlocks : [],
    updatedAt: Date.now(),
  });
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npx eslint src/firebase/org/orgs.js`
Expected: no errors (warnings about unused are acceptable only if none exist here — there should be none).

- [ ] **Step 3: Commit (stage only)**

```bash
git add src/firebase/org/orgs.js
# commit only when the user asks
```

---

### Task 2: Org intention tagging + org-scoped reads

Adds `orgId` support to intention creation and an org-scoped intention list. Reuses the existing `intentions` collection.

**Files:**
- Modify: `src/firebase/intention/add.js` (the `addIntention` function, lines 15-58)
- Modify: `src/firebase/intention/get.js`

**Interfaces:**
- Consumes: existing `intentions` collection.
- Produces:
  - `addIntention(data)` now persists `orgId` when present (default `null`).
  - `listOrgIntentions(orgId: string): Promise<Intention[]>` in `get.js` — intentions where `orgId == orgId`, sorted by `createdAt` ascending.

- [ ] **Step 1: Add `orgId` to `addIntention`**

In `src/firebase/intention/add.js`, inside `addIntention`, add `orgId` to the destructure and to `convertedData`. Change the destructure block (currently ending with `collectionName = "",`) to include:

```javascript
      collectionName = "",
      orgId = null,
    } = data;
```

And add to `convertedData` (after `collectionName,`):

```javascript
      collectionName,
      orgId: orgId || null,
    };
```

- [ ] **Step 2: Add `listOrgIntentions` to `get.js`**

In `src/firebase/intention/get.js`, add these imports and function. Update the top import line to:

```javascript
import { collection, getDocs, query, where } from "firebase/firestore";
```

Append:

```javascript
export const listOrgIntentions = async (orgId) => {
  if (!orgId) return [];
  try {
    const q = query(ref, where("orgId", "==", orgId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch (error) {
    console.error("listOrgIntentions :", error);
    throw error;
  }
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npx eslint src/firebase/intention/add.js src/firebase/intention/get.js`
Expected: no errors.

- [ ] **Step 4: Commit (stage only)**

```bash
git add src/firebase/intention/add.js src/firebase/intention/get.js
```

---

### Task 3: Org vote write path

Routes increments on org counters to `orgs/{orgId}/votes` instead of the legacy update-log collection, keeping the atomic count increment.

**Files:**
- Modify: `src/firebase/intention/add.js` (the `addCounter` function, lines 60-140)

**Interfaces:**
- Consumes: `getOrgById` is NOT needed here — the caller passes `orgId` directly.
- Produces: `addCounter({ id, value, user, orgId })` — when `orgId` is truthy, after the increment transaction it writes one doc to `orgs/{orgId}/votes` as `{ intentionId, voterName, value, timestamp }` and does NOT write the legacy log. When `orgId` is falsy, behavior is unchanged.

- [ ] **Step 1: Accept `orgId` in `addCounter`**

In `src/firebase/intention/add.js`, change the `addCounter` destructure line:

```javascript
    const { id = "", value = 0, user = "", orgId = "" } = data;
```

- [ ] **Step 2: Branch the log write on `orgId`**

Replace the post-transaction log block (currently):

```javascript
    const updateRef = collection(DB, appliedValue.logCollectionName);
    await addDoc(updateRef, {
      newCount: appliedValue.appliedValue,
      timestamp: serverTimestamp(),
      user,
    });
```

with:

```javascript
    if (orgId) {
      const votesRef = collection(DB, "orgs", orgId, "votes");
      await addDoc(votesRef, {
        intentionId: id,
        voterName: user,
        value: appliedValue.appliedValue,
        timestamp: serverTimestamp(),
      });
    } else {
      const updateRef = collection(DB, appliedValue.logCollectionName);
      await addDoc(updateRef, {
        newCount: appliedValue.appliedValue,
        timestamp: serverTimestamp(),
        user,
      });
    }
```

- [ ] **Step 3: Verify it compiles**

Run: `npx eslint src/firebase/intention/add.js`
Expected: no errors.

- [ ] **Step 4: Commit (stage only)**

```bash
git add src/firebase/intention/add.js
```

---

### Task 4: Day-wise vote grouping util (the one unit-tested piece)

Pure function that turns a flat vote list into a day-grouped, per-voter-aggregated structure for the admin page. This is the only piece with non-trivial logic and no UI, so it gets a Jest test per the repo's testing rule.

**Files:**
- Create: `src/utils/groupVotesByDay.js`
- Test: `src/utils/groupVotesByDay.test.js`

**Interfaces:**
- Produces: `groupVotesByDay(votes: { voterName: string, value: number, timestampMs: number }[]): { date: string, totalCount: number, totalValue: number, voters: { name: string, value: number, count: number }[] }[]`
  - `date` is `YYYY-MM-DD` (local time).
  - Days sorted newest-first; voters within a day sorted by `value` desc.
  - `totalCount` = number of vote events that day; `totalValue` = sum of `value` that day.

- [ ] **Step 1: Write the failing test**

Create `src/utils/groupVotesByDay.test.js`:

```javascript
import { groupVotesByDay } from "./groupVotesByDay";

const ms = (iso) => new Date(iso).getTime();

test("groups votes by local day, newest day first", () => {
  const votes = [
    { voterName: "Anna", value: 5, timestampMs: ms("2026-06-27T10:00:00") },
    { voterName: "Anna", value: 3, timestampMs: ms("2026-06-27T12:00:00") },
    { voterName: "Bea", value: 10, timestampMs: ms("2026-06-28T09:00:00") },
  ];

  const result = groupVotesByDay(votes);

  expect(result.map((d) => d.date)).toEqual(["2026-06-28", "2026-06-27"]);
});

test("aggregates per voter within a day, highest value first", () => {
  const votes = [
    { voterName: "Anna", value: 5, timestampMs: ms("2026-06-27T10:00:00") },
    { voterName: "Anna", value: 3, timestampMs: ms("2026-06-27T12:00:00") },
    { voterName: "Bea", value: 20, timestampMs: ms("2026-06-27T11:00:00") },
  ];

  const [day] = groupVotesByDay(votes);

  expect(day.totalValue).toBe(28);
  expect(day.totalCount).toBe(3);
  expect(day.voters).toEqual([
    { name: "Bea", value: 20, count: 1 },
    { name: "Anna", value: 8, count: 2 },
  ]);
});

test("returns empty array for no votes", () => {
  expect(groupVotesByDay([])).toEqual([]);
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test -- --watchAll=false --testPathPattern=groupVotesByDay`
Expected: FAIL — "Cannot find module './groupVotesByDay'".

- [ ] **Step 3: Implement the util**

Create `src/utils/groupVotesByDay.js`:

```javascript
const toLocalDateKey = (timestampMs) => {
  const d = new Date(timestampMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const groupVotesByDay = (votes = []) => {
  const days = new Map();

  votes.forEach((vote) => {
    const value = Number(vote?.value || 0);
    const name = String(vote?.voterName || "Anonymous").trim() || "Anonymous";
    const dateKey = toLocalDateKey(vote?.timestampMs || Date.now());

    if (!days.has(dateKey)) {
      days.set(dateKey, { totalValue: 0, totalCount: 0, voters: new Map() });
    }
    const day = days.get(dateKey);
    day.totalValue += value;
    day.totalCount += 1;

    const voter = day.voters.get(name) || { name, value: 0, count: 0 };
    voter.value += value;
    voter.count += 1;
    day.voters.set(name, voter);
  });

  return Array.from(days.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, day]) => ({
      date,
      totalValue: day.totalValue,
      totalCount: day.totalCount,
      voters: Array.from(day.voters.values()).sort(
        (a, b) => b.value - a.value
      ),
    }));
};
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm test -- --watchAll=false --testPathPattern=groupVotesByDay`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit (stage only)**

```bash
git add src/utils/groupVotesByDay.js src/utils/groupVotesByDay.test.js
```

---

### Task 5: Org votes reader + voter-name localStorage helper

Read path for the admin list, plus the per-org voter-name persistence used by the counter page.

**Files:**
- Create: `src/firebase/org/votes.js`
- Create: `src/utils/orgVoter.js`

**Interfaces:**
- Produces:
  - `listOrgVotes(orgId: string): Promise<{ id, intentionId, voterName, value, timestampMs }[]>` — all votes for the org, `timestamp` converted to ms (`timestampMs`), newest first. Feeds `groupVotesByDay`.
  - `getOrgVoterName(slug: string): string` — reads `localStorage` key `orgVoter:<slug>` (`""` if none / SSR).
  - `setOrgVoterName(slug: string, name: string): void` — writes/removes the same key.

- [ ] **Step 1: Write the votes reader**

Create `src/firebase/org/votes.js`:

```javascript
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { DB } from "../../config/firebase";

export const listOrgVotes = async (orgId) => {
  if (!orgId) return [];
  const votesRef = collection(DB, "orgs", orgId, "votes");
  const q = query(votesRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() || {};
    const ts = data.timestamp;
    const timestampMs =
      ts && typeof ts.toMillis === "function" ? ts.toMillis() : Date.now();
    return {
      id: doc.id,
      intentionId: data.intentionId || "",
      voterName: data.voterName || "",
      value: Number(data.value || 0),
      timestampMs,
    };
  });
};
```

- [ ] **Step 2: Write the voter-name helper**

Create `src/utils/orgVoter.js`:

```javascript
const keyFor = (slug) => `orgVoter:${String(slug || "").trim().toLowerCase()}`;

export const getOrgVoterName = (slug) => {
  if (typeof window === "undefined" || !slug) return "";
  return localStorage.getItem(keyFor(slug)) || "";
};

export const setOrgVoterName = (slug, name) => {
  if (typeof window === "undefined" || !slug) return;
  const cleaned = String(name || "").trim();
  if (cleaned) {
    localStorage.setItem(keyFor(slug), cleaned);
  } else {
    localStorage.removeItem(keyFor(slug));
  }
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npx eslint src/firebase/org/votes.js src/utils/orgVoter.js`
Expected: no errors.

- [ ] **Step 4: Commit (stage only)**

```bash
git add src/firebase/org/votes.js src/utils/orgVoter.js
```

---

### Task 6: TextBlock renderer component

Renders one super-admin-configured styled text block. Shared by the landing page and the manage-page preview.

**Files:**
- Create: `src/pages/Org/TextBlock.jsx`

**Interfaces:**
- Consumes: a `TextBlock` object (Task 1 shape).
- Produces: `default export TextBlock({ block })` — renders an MUI `Typography` styled by the block's fields. Unknown/empty fields fall back to sane defaults.

- [ ] **Step 1: Write the component**

Create `src/pages/Org/TextBlock.jsx`:

```javascript
import React from "react";
import { Typography } from "@mui/material";

const VARIANT_MAP = {
  heading: "h5",
  subheading: "h6",
  paragraph: "body1",
  verse: "body1",
};

const TextBlock = ({ block }) => {
  if (!block || !String(block.text || "").trim()) return null;

  const variant = VARIANT_MAP[block.variant] || "body1";
  const isVerse = block.variant === "verse";

  return (
    <Typography
      variant={variant}
      sx={{
        color: block.color || "#311b45",
        fontSize: block.fontSize || undefined,
        fontWeight: block.weight || (isVerse ? 700 : 500),
        textAlign: block.align || "center",
        fontStyle: isVerse ? "italic" : "normal",
        lineHeight: 1.7,
        whiteSpace: "pre-line",
        my: 1.5,
      }}
    >
      {block.text}
    </Typography>
  );
};

export default TextBlock;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx eslint src/pages/Org/TextBlock.jsx`
Expected: no errors.

- [ ] **Step 3: Commit (stage only)**

```bash
git add src/pages/Org/TextBlock.jsx
```

---

### Task 7: Org landing page

Shows org name, super-admin text blocks, and the list of that org's counters. No Nanma Maram branding.

**Files:**
- Create: `src/pages/Org/OrgLanding.jsx`

**Interfaces:**
- Consumes: `getOrgBySlug` (Task 1), `listOrgIntentions` (Task 2), `TextBlock` (Task 6). Route param `:orgSlug`.
- Produces: `default export OrgLanding` — renders at `/:orgSlug`. Each counter links to `/:orgSlug/counter/:id`. Unknown slug → "Organization not found".

- [ ] **Step 1: Write the page**

Create `src/pages/Org/OrgLanding.jsx`:

```javascript
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { listOrgIntentions } from "../../firebase/intention/get";
import TextBlock from "./TextBlock";

const OrgLanding = () => {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [intentions, setIntentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const found = await getOrgBySlug(orgSlug);
      if (!active) return;
      setOrg(found);
      if (found) {
        const list = await listOrgIntentions(found.id);
        if (active) setIntentions(list);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [orgSlug]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!org) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Organization not found
        </Typography>
      </Container>
    );
  }

  const accent = org.primaryColor || "#4a148c";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ fontWeight: 800, color: accent, mb: 2 }}
      >
        {org.name}
      </Typography>

      {(org.textBlocks || []).map((block) => (
        <TextBlock key={block.id} block={block} />
      ))}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {intentions.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary">
              No prayers yet.
            </Typography>
          </Grid>
        ) : (
          intentions.map((item) => (
            <Grid item xs={12} sm={6} key={item.id}>
              <Card
                variant="outlined"
                sx={{ borderRadius: 3, borderColor: `${accent}33` }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/${org.slug}/counter/${item.id}`}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, color: accent }}>
                      {item.name || "Prayer"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {Number(item.count || 0).toLocaleString("en-IN")}
                      {Number(item.maxCount) > 0
                        ? ` / ${Number(item.maxCount).toLocaleString("en-IN")}`
                        : ""}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
};

export default OrgLanding;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx eslint src/pages/Org/OrgLanding.jsx`
Expected: no errors.

- [ ] **Step 3: Commit (stage only)**

```bash
git add src/pages/Org/OrgLanding.jsx
```

---

### Task 8: Org counter page

The branded counter: live count via `onSnapshot`, name prefilled from `localStorage`, increment writes an org vote. Deliberately simpler than the main `Counter` (no Malayalam defaults, no completion modal) to keep org pages clean and maintainable.

**Files:**
- Create: `src/pages/Org/OrgCounter.jsx`

**Interfaces:**
- Consumes: `getOrgBySlug` (Task 1), `addCounter` (Task 3, with `orgId`), `getOrgVoterName`/`setOrgVoterName` (Task 5), `SnackbarContext`/`SNACK_BAR_SEVERITY_TYPES`, `DB`. Route params `:orgSlug`, `:id`.
- Produces: `default export OrgCounter` — renders at `/:orgSlug/counter/:id`.

- [ ] **Step 1: Write the page**

Create `src/pages/Org/OrgCounter.jsx`:

```javascript
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DB } from "../../config/firebase";
import { addCounter } from "../../firebase/intention/add";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { getOrgVoterName, setOrgVoterName } from "../../utils/orgVoter";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const OrgCounter = () => {
  const { orgSlug, id } = useParams();
  const { showSnackbar } = useContext(SnackbarContext);
  const [org, setOrg] = useState(null);
  const [counterData, setCounterData] = useState({});
  const [loading, setLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { username: getOrgVoterName(orgSlug), inputValue: "" },
  });
  const username = watch("username");

  useEffect(() => {
    let active = true;
    getOrgBySlug(orgSlug).then((found) => {
      if (active) setOrg(found);
    });
    return () => {
      active = false;
    };
  }, [orgSlug]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(DB, "intentions", id), (snap) => {
      if (snap.exists()) setCounterData(snap.data());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (username !== undefined) setOrgVoterName(orgSlug, username);
  }, [orgSlug, username]);

  const onSubmit = async (data) => {
    try {
      const numericValue = Number(data.inputValue);
      if (numericValue <= 0) throw new Error("Please enter a count greater than zero");
      if (!org) throw new Error("Organization not found");
      const res = await addCounter({
        id,
        value: numericValue,
        user: data.username,
        orgId: org.id,
      });
      showSnackbar(res?.message || "Count added", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      reset({ username: data.username, inputValue: "" });
    } catch (error) {
      showSnackbar(error?.message || "Something went wrong", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const accent = org?.primaryColor || "#4a148c";
  const currentCount = Number(counterData?.count || 0);
  const targetCount = Number(counterData?.maxCount || 0);
  const fmt = (v) => Number(v || 0).toLocaleString("en-IN");

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      <Card variant="outlined" sx={{ borderRadius: 4, borderColor: `${accent}33` }}>
        <CardContent>
          <Typography align="center" sx={{ fontWeight: 800, color: accent, mb: 0.5 }}>
            {org?.name}
          </Typography>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
            {counterData?.name || "Prayer"}
          </Typography>

          {counterData?.intention ? (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 3,
                textAlign: "center",
                color: "#fff",
                backgroundImage: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
              }}
            >
              <Typography sx={{ fontWeight: 700, lineHeight: 1.7 }}>
                {counterData.intention}
              </Typography>
            </Box>
          ) : null}

          <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: "#faf7ff" }}>
                <Typography variant="caption" color="text.secondary">CURRENT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: accent }}>{fmt(currentCount)}</Typography>
              </Box>
            </Grid>
            {targetCount > 0 ? (
              <Grid item xs={6}>
                <Box sx={{ textAlign: "center", p: 2, borderRadius: 3, bgcolor: "#faf7ff" }}>
                  <Typography variant="caption" color="text.secondary">TARGET</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1976D2" }}>{fmt(targetCount)}</Typography>
                </Box>
              </Grid>
            ) : null}
          </Grid>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="username"
              control={control}
              rules={{ required: "Name is required", minLength: { value: 3, message: "At least 3 characters" } }}
              render={({ field }) => (
                <TextField {...field} label="Name" fullWidth sx={{ mb: 2 }} error={!!errors.username} helperText={errors.username?.message} />
              )}
            />
            <Controller
              name="inputValue"
              control={control}
              rules={{
                required: "Value is required",
                validate: {
                  isPositiveInteger: (v) => (Number.isInteger(Number(v)) && Number(v) > 0) || "Must be a positive integer",
                  maxValue: (v) => Number(v) <= 1000 || "Must not exceed 1000",
                },
              }}
              render={({ field }) => (
                <TextField {...field} label="Recite & Enter Count" type="number" fullWidth sx={{ mb: 2 }} error={!!errors.inputValue} helperText={errors.inputValue?.message} inputProps={{ min: 1, max: 1000 }} />
              )}
            />
            <Button type="submit" variant="contained" fullWidth startIcon={<AddIcon />} sx={{ height: 50, borderRadius: 3, fontWeight: 700, bgcolor: accent, "&:hover": { bgcolor: accent } }}>
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default OrgCounter;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx eslint src/pages/Org/OrgCounter.jsx`
Expected: no errors.

- [ ] **Step 3: Commit (stage only)**

```bash
git add src/pages/Org/OrgCounter.jsx
```

---

### Task 9: Org admin page (code gate + day-wise voter list)

Prompts for the org `adminCode`; on match, shows votes grouped by day and voter via `groupVotesByDay`.

**Files:**
- Create: `src/pages/Org/OrgAdmin.jsx`

**Interfaces:**
- Consumes: `getOrgBySlug` (Task 1), `listOrgVotes` (Task 5), `groupVotesByDay` (Task 4). Route param `:orgSlug`.
- Produces: `default export OrgAdmin` — renders at `/:orgSlug/admin`.

- [ ] **Step 1: Write the page**

Create `src/pages/Org/OrgAdmin.jsx`:

```javascript
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { getOrgBySlug } from "../../firebase/org/orgs";
import { listOrgVotes } from "../../firebase/org/votes";
import { groupVotesByDay } from "../../utils/groupVotesByDay";

const OrgAdmin = () => {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  useEffect(() => {
    let active = true;
    getOrgBySlug(orgSlug).then((found) => {
      if (!active) return;
      setOrg(found);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [orgSlug]);

  const handleUnlock = async () => {
    if (!org) return;
    if (code.trim() !== String(org.adminCode || "")) {
      setError("Incorrect code");
      return;
    }
    setError("");
    setUnlocked(true);
    setLoadingVotes(true);
    const votes = await listOrgVotes(org.id);
    setDays(groupVotesByDay(votes));
    setLoadingVotes(false);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!org) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Organization not found</Typography>
      </Container>
    );
  }

  const accent = org.primaryColor || "#4a148c";

  if (!unlocked) {
    return (
      <Container maxWidth="xs" sx={{ py: 8 }}>
        <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
          {org.name} — Admin
        </Typography>
        <TextField
          label="Admin code"
          type="password"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUnlock();
          }}
        />
        <Button fullWidth variant="contained" onClick={handleUnlock} sx={{ bgcolor: accent, "&:hover": { bgcolor: accent } }}>
          View voters
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: accent, mb: 2 }}>
        {org.name} — Daily voters
      </Typography>
      {loadingVotes ? (
        <CircularProgress />
      ) : days.length === 0 ? (
        <Typography color="text.secondary">No votes yet.</Typography>
      ) : (
        days.map((day) => (
          <Card key={day.date} variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Typography sx={{ fontWeight: 700 }}>{day.date}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {day.totalValue.toLocaleString("en-IN")} total · {day.totalCount} entries
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <List disablePadding>
                {day.voters.map((voter) => (
                  <ListItem key={voter.name} disableGutters sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={voter.name}
                      secondary={`${voter.value.toLocaleString("en-IN")} · ${voter.count} ${voter.count === 1 ? "entry" : "entries"}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
};

export default OrgAdmin;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx eslint src/pages/Org/OrgAdmin.jsx`
Expected: no errors.

- [ ] **Step 3: Commit (stage only)**

```bash
git add src/pages/Org/OrgAdmin.jsx
```

---

### Task 10: Super-admin org manager page

Lets the super admin create/edit orgs (slug, name, adminCode, primary color, text blocks) and create counters tagged to an org. Gated to super admins via the existing `useAuth`.

**Files:**
- Create: `src/pages/Org/OrgManage.jsx`

**Interfaces:**
- Consumes: `useAuth` (`src/components/AuthProvider`), `listOrgs`/`createOrg`/`updateOrg`/`getOrgById` (Task 1), `addIntention` (Task 2, with `orgId`), `listOrgIntentions` (Task 2), `TextBlock` (Task 6), `SnackbarContext`.
- Produces: `default export OrgManage` — rendered (wrapped in `ProtectedRoute`) at `/org-manage`. Non-super-admins see an "access denied" message.

- [ ] **Step 1: Write the page**

Create `src/pages/Org/OrgManage.jsx`:

```javascript
import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../components/AuthProvider";
import {
  createOrg,
  getOrgById,
  listOrgs,
  updateOrg,
} from "../../firebase/org/orgs";
import { addIntention } from "../../firebase/intention/add";
import { listOrgIntentions } from "../../firebase/intention/get";
import TextBlock from "./TextBlock";
import {
  SNACK_BAR_SEVERITY_TYPES,
  SnackbarContext,
} from "../../components/Snackbar";

const EMPTY_BLOCK = () => ({
  id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  text: "",
  variant: "paragraph",
  color: "#311b45",
  fontSize: "1rem",
  weight: 500,
  align: "center",
});

const EMPTY_ORG = {
  slug: "",
  name: "",
  adminCode: "",
  primaryColor: "#4a148c",
  textBlocks: [],
};

const OrgManage = () => {
  const { isSuperAdmin, loading } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const [orgs, setOrgs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ORG);
  const [intentions, setIntentions] = useState([]);
  const [newIntention, setNewIntention] = useState({ name: "", intention: "", maxCount: 0 });

  const refreshOrgs = async () => setOrgs(await listOrgs());

  useEffect(() => {
    if (isSuperAdmin) refreshOrgs();
  }, [isSuperAdmin]);

  const loadOrgForEdit = async (id) => {
    const org = await getOrgById(id);
    if (!org) return;
    setEditingId(id);
    setForm({
      slug: org.slug || "",
      name: org.name || "",
      adminCode: org.adminCode || "",
      primaryColor: org.primaryColor || "#4a148c",
      textBlocks: org.textBlocks || [],
    });
    setIntentions(await listOrgIntentions(id));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_ORG);
    setIntentions([]);
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setBlock = (index, key, value) =>
    setForm((f) => ({
      ...f,
      textBlocks: f.textBlocks.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
    }));

  const addBlock = () => setForm((f) => ({ ...f, textBlocks: [...f.textBlocks, EMPTY_BLOCK()] }));
  const removeBlock = (index) =>
    setForm((f) => ({ ...f, textBlocks: f.textBlocks.filter((_, i) => i !== index) }));

  const saveOrg = async () => {
    try {
      if (!form.slug.trim() || !form.name.trim()) throw new Error("Slug and name are required");
      if (editingId) {
        await updateOrg(editingId, form);
        showSnackbar("Organization updated", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      } else {
        const id = await createOrg(form);
        showSnackbar("Organization created", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
        await loadOrgForEdit(id);
      }
      await refreshOrgs();
    } catch (error) {
      showSnackbar(error?.message || "Save failed", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  const addCounterToOrg = async () => {
    try {
      if (!editingId) throw new Error("Save the organization first");
      if (!newIntention.name.trim()) throw new Error("Counter name is required");
      await addIntention({
        name: newIntention.name,
        intention: newIntention.intention,
        maxCount: Number(newIntention.maxCount) || 0,
        orgId: editingId,
      });
      showSnackbar("Counter added", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setNewIntention({ name: "", intention: "", maxCount: 0 });
      setIntentions(await listOrgIntentions(editingId));
    } catch (error) {
      showSnackbar(error?.message || "Failed to add counter", SNACK_BAR_SEVERITY_TYPES.ERROR);
    }
  };

  if (loading) return null;
  if (!isSuperAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6">Access denied</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Organizations</Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {orgs.map((org) => (
          <Button key={org.id} size="small" variant={editingId === org.id ? "contained" : "outlined"} onClick={() => loadOrgForEdit(org.id)}>
            {org.name}
          </Button>
        ))}
        <Button size="small" color="secondary" onClick={resetForm}>+ New</Button>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>
            {editingId ? "Edit organization" : "New organization"}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" fullWidth value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Slug (URL)" fullWidth value={form.slug} onChange={(e) => setField("slug", e.target.value)} helperText="e.g. grace-sisters" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Admin code" fullWidth value={form.adminCode} onChange={(e) => setField("adminCode", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Primary color" fullWidth value={form.primaryColor} onChange={(e) => setField("primaryColor", e.target.value)} helperText="hex e.g. #4a148c" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Text blocks</Typography>
          {form.textBlocks.map((block, index) => (
            <Box key={block.id} sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton size="small" onClick={() => removeBlock(index)} aria-label="Remove block">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <TextField label="Text" fullWidth multiline minRows={2} value={block.text} onChange={(e) => setBlock(index, "text", e.target.value)} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <TextField select label="Variant" fullWidth value={block.variant} onChange={(e) => setBlock(index, "variant", e.target.value)}>
                    {["heading", "subheading", "paragraph", "verse"].map((v) => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label="Color" fullWidth value={block.color} onChange={(e) => setBlock(index, "color", e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label="Font size" fullWidth value={block.fontSize} onChange={(e) => setBlock(index, "fontSize", e.target.value)} helperText="e.g. 1.25rem" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField select label="Align" fullWidth value={block.align} onChange={(e) => setBlock(index, "align", e.target.value)}>
                    {["left", "center", "right"].map((a) => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, p: 1, bgcolor: "#faf7ff", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Preview</Typography>
                <TextBlock block={block} />
              </Box>
            </Box>
          ))}
          <Button onClick={addBlock} size="small">+ Add text block</Button>

          <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={saveOrg}>{editingId ? "Update" : "Create"}</Button>
            {editingId ? <Button onClick={resetForm}>Done</Button> : null}
          </Box>
        </CardContent>
      </Card>

      {editingId ? (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Counters</Typography>
            {intentions.map((item) => (
              <Typography key={item.id} variant="body2" sx={{ mb: 0.5 }}>
                • {item.name || "Prayer"} — {Number(item.count || 0).toLocaleString("en-IN")}
                {Number(item.maxCount) > 0 ? ` / ${Number(item.maxCount).toLocaleString("en-IN")}` : ""}
              </Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField label="Counter name" fullWidth value={newIntention.name} onChange={(e) => setNewIntention((n) => ({ ...n, name: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Intention text" fullWidth value={newIntention.intention} onChange={(e) => setNewIntention((n) => ({ ...n, intention: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Target (0 = none)" type="number" fullWidth value={newIntention.maxCount} onChange={(e) => setNewIntention((n) => ({ ...n, maxCount: e.target.value }))} />
              </Grid>
            </Grid>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={addCounterToOrg}>Add counter</Button>
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
};

export default OrgManage;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx eslint src/pages/Org/OrgManage.jsx`
Expected: no errors.

- [ ] **Step 3: Commit (stage only)**

```bash
git add src/pages/Org/OrgManage.jsx
```

---

### Task 11: Wire routes into App.js

Adds the org routes. The `/:orgSlug` family must be declared **after** all existing static routes so React Router prefers static segments; this is naturally satisfied by appending before `</Routes>`.

**Files:**
- Modify: `src/App.js`

**Interfaces:**
- Consumes: `OrgManage` (Task 10), `OrgLanding` (Task 7), `OrgCounter` (Task 8), `OrgAdmin` (Task 9).
- Produces routes: `/org-manage` (protected), `/:orgSlug`, `/:orgSlug/counter/:id`, `/:orgSlug/admin`.

- [ ] **Step 1: Add imports**

In `src/App.js`, after the existing page imports (after the `CrewProfile` import on line 26), add:

```javascript
import OrgManage from "./pages/Org/OrgManage";
import OrgLanding from "./pages/Org/OrgLanding";
import OrgCounter from "./pages/Org/OrgCounter";
import OrgAdmin from "./pages/Org/OrgAdmin";
```

- [ ] **Step 2: Add the routes**

In `src/App.js`, immediately before the closing `</Routes>` (line 209), insert:

```javascript
          <Route
            path="/org-manage"
            element={
              <ProtectedRoute>
                <OrgManage />
              </ProtectedRoute>
            }
          />
          {/* Org public routes — keep LAST so static routes above win. */}
          <Route path="/:orgSlug" element={<OrgLanding />} />
          <Route path="/:orgSlug/counter/:id" element={<OrgCounter />} />
          <Route path="/:orgSlug/admin" element={<OrgAdmin />} />
```

- [ ] **Step 3: Verify it compiles**

Run: `npx eslint src/App.js`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Run: `npm start`
Then, in the browser:
1. Go to `http://localhost:3000/org-manage`, sign in as super admin. Create an org: name "Grace Sisters", slug "grace-sisters", admin code "graceX", color "#2e7d32". Add a text block (heading) and Save. Add a counter "Rosary", target 1000.
2. Go to `http://localhost:3000/grace-sisters` — see the org name, text block, and the Rosary counter. Confirm NO Nanma Maram footer/version anywhere.
3. Open the Rosary counter, enter a name + a count, submit. Confirm the count increments and the name is remembered on reload.
4. Go to `http://localhost:3000/grace-sisters/admin`, enter "graceX" — see today's date with your name and total.
5. Confirm existing routes still work: `http://localhost:3000/intention-list` and `http://localhost:3000/counter/<existing-id>` are unaffected, and an existing intention's increment still writes to its legacy log (open it on the main app, no `orgId`).
6. Go to `http://localhost:3000/no-such-org` — see "Organization not found".

Expected: all six checks pass.

- [ ] **Step 5: Commit (stage only)**

```bash
git add src/App.js
```

---

### Task 12: Second hosting site (counterprayer)

Configures a second Firebase Hosting site serving the same build, so org users get `counterprayer.web.app/<slug>`.

**Files:**
- Modify: `firebase.json`
- Modify: `.firebaserc`

**Interfaces:** none (infra config).

- [ ] **Step 1: Create the hosting site**

Run: `firebase hosting:sites:create counterprayer`
Expected: confirms site `counterprayer` created (or "already exists" — acceptable). If the name is taken globally, pick an available one and use it consistently in the steps below.

- [ ] **Step 2: Rewrite `firebase.json` to two targets**

Replace the entire contents of `firebase.json` with:

```json
{
  "hosting": [
    {
      "target": "main",
      "public": "build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "counter",
      "public": "build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

- [ ] **Step 3: Map targets in `.firebaserc`**

Replace the entire contents of `.firebaserc` with:

```json
{
  "projects": {
    "default": "nanma-maram"
  },
  "targets": {
    "nanma-maram": {
      "hosting": {
        "main": ["nanma-maram"],
        "counter": ["counterprayer"]
      }
    }
  }
}
```

- [ ] **Step 4: Apply the target mapping**

Run: `firebase target:apply hosting counter counterprayer`
Expected: "Applied hosting target counter to counterprayer".

- [ ] **Step 5: Build and deploy both sites**

Run: `npm run build && firebase deploy --only hosting`
Expected: deploy succeeds for both `main` and `counter`; output lists `counterprayer.web.app`.

- [ ] **Step 6: Verify the neutral URL**

Visit `https://counterprayer.web.app/grace-sisters`.
Expected: the org landing renders with no Nanma Maram branding in the URL or page.

- [ ] **Step 7: Commit (stage only)**

```bash
git add firebase.json .firebaserc
```

---

### Task 13: Version bump

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump the minor version**

Run: `npm version minor --no-git-tag-version`
Expected: prints the new version (e.g. `v1.21.0`); `package.json` updated.

- [ ] **Step 2: Commit (stage only)**

```bash
git add package.json package-lock.json
```

---

## Self-Review

**Spec coverage:**
- Second hosting site / neutral URL → Task 12. ✅
- Shared DB tagged by `orgId`; isolation both directions → Tasks 2 (tag + scoped read), 3 (org votes only when `orgId`). ✅
- `orgs/{orgId}/votes` log shape → Task 3 (write), Task 5 (read). ✅
- Voter name once, `localStorage` `orgVoter:<slug>` → Task 5 helper, Task 8 usage. ✅
- Per-org admin code, client-side → Task 9. ✅
- Super-admin-only text blocks, content + styling → Task 6 (render), Task 10 (editor, super-admin gated). ✅
- No Nanma Maram branding / no `ChapelFooter` on org pages → Tasks 7, 8, 9 (none import `ChapelFooter`). ✅
- Routes `/:orgSlug`, `/:orgSlug/counter/:id`, `/:orgSlug/admin` after static routes → Task 11. ✅
- Org needs counters; who creates them → Task 10 (super admin creates counters tagged to org). ✅
- Version bump → Task 13. ✅
- Tests only where genuinely needed → Task 4 only; all else manual. ✅

**Placeholder scan:** No TBD/TODO; every code step contains complete code; the manual-test steps list exact URLs and expected results.

**Type consistency:** `Org`/`TextBlock` shapes from Task 1 are used unchanged in Tasks 6, 7, 8, 9, 10. `addCounter({ id, value, user, orgId })` defined in Task 3 and called identically in Task 8. Vote doc `{ intentionId, voterName, value, timestamp }` written in Task 3 and read in Task 5 (mapped to `timestampMs`), consumed by `groupVotesByDay` in Task 4 and rendered in Task 9. `listOrgIntentions(orgId)` defined in Task 2, used in Tasks 7 and 10. Consistent throughout.
```

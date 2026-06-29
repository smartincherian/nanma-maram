# Multi-Org Prayer Counters — Design

**Date:** 2026-06-28
**Status:** Approved design, pending spec review

## Problem

Outside organizations (Grace Sisters, Jesus Youth) want to run prayer counters
without any "Nanma Maram" branding and without `nanmamaram.web.app` in the URL.
They want a neutral URL like `counterprayer.web.app/<org-name>`. Each org needs
an admin view listing who voted, grouped by day. The super admin (the maintainer)
configures each org's branding and free-form text content.

## Decisions (settled during brainstorming)

1. **Hosting/isolation:** One Firebase project (`nanma-maram`), one Firestore.
   Add a **second hosting site** `counterprayer` and deploy the **same React
   build** to it. No separate project. Org data is **shared DB, tagged by
   `orgId`**.
2. **Voter identity:** Person types their name once; it is stored in
   `localStorage` and auto-attached to every vote. No login.
3. **Dynamic text blocks:** Configured by the **super admin only**. Org admins
   cannot edit them.
4. **Org admin access:** **Per-org secret code** (same trust model as the
   existing hardcoded `1305`), stored on the org document.

## Non-goals (YAGNI)

- No separate Firebase project / separate database.
- No Google login for voters or org admins.
- No server-side enforcement of codes or voter identity — client-side trust,
  matching the current app's security model.
- No org-admin editing of branding or text blocks.

## Architecture

### Hosting

- Create a second site: `firebase hosting:sites:create counterprayer`.
- Add a `targets` (or `site`) configuration in `firebase.json` so both
  `nanma-maram` (existing) and `counterprayer` serve `build/` with the SPA
  catch-all rewrite.
- Deploy the same build to both sites. Org pages are reached only via
  `counterprayer.web.app/<slug>`, so org users never see Nanma Maram URLs.
- A reverse leak (`nanmamaram.web.app/grace-sisters` also resolving) is harmless
  and out of scope to block.

### Routing (new routes in `src/App.js`)

| URL | Page |
|-----|------|
| `/:orgSlug` | Org landing — org name, super-admin text blocks, list of org's counters |
| `/:orgSlug/counter/:id` | Live counter, org-branded |
| `/:orgSlug/admin` | Enter org code → day-wise voter list |

- `/:orgSlug` is a single dynamic first segment. React Router v6 matches static
  segments (`/intention-add`, `/counter/:id`, `/admins`, `/crew`, …) **before**
  the dynamic `/:orgSlug`, so existing routes are unaffected.
- An unknown slug renders an "organization not found" state (look up the org by
  slug in Firestore; if no match, show not-found).
- Org pages must render **no** `ChapelFooter` and no Nanma Maram branding. They
  show org-specific branding instead.

### Data model (shared Firestore)

**New `orgs` collection** — one doc per org:

```
{
  slug: "grace-sisters",          // unique, used in URL
  name: "Grace Sisters",
  adminCode: "<secret>",          // per-org code for /:orgSlug/admin
  branding: { title, primaryColor, ... },
  textBlocks: [
    { id, text, variant, color, fontSize, weight, align }
  ],
  createdAt
}
```

**`intentions` collection (existing)** — add an `orgId` field.

- An org's counters are intentions tagged with that org's id.
- Org landing queries `intentions where orgId == <id>`.
- Existing Nanma Maram intentions have no `orgId`, so they never appear in any
  org and org counters never appear in the main app's lists.

**Vote log — subcollection per organization:** `orgs/{orgId}/votes/{voteId}` —
one doc per increment on an org counter:

```
{ intentionId, voterName, value, timestamp }
```

- **Why per-org and not per-prayer:** the admin's primary view is the org-wide
  day-wise voter list (across all the org's prayers). A per-org subcollection
  answers that with a single query on a known path (`orgs/{orgId}/votes` ordered
  by `timestamp`) — no composite index, no collection-group query. Per-prayer
  breakdown is the same query plus `where intentionId == <id>`. A per-prayer
  subcollection would force a collection-group query for the primary org-wide
  view, adding indexing and rules complexity for the secondary case.
- This is a separate audit log; the live count still lives on the `intentions`
  doc and is incremented inside the existing transaction.
- Admin day-wise list: query `orgs/{orgId}/votes` ordered by `timestamp`, grouped
  client-side by day then by `voterName`.

### Write path

`addCounter` (`src/firebase/intention/add.js`) currently runs a transaction to
increment `count` and append a log doc `{ newCount, timestamp, user }`. For org
counters it instead writes a vote doc to `orgs/{orgId}/votes` carrying
`intentionId`, `voterName`, `value`, and `timestamp`. The exact wiring (extend
`addCounter` vs. a sibling function) is decided in the implementation plan.

### Voter identity

- First vote in an org opens a small dialog asking the person's name.
- Stored in `localStorage` under `orgVoter:<slug>`.
- Auto-attached to every subsequent vote; no re-prompt.
- Admin list groups by date, then by name.

### Dynamic text blocks (super admin)

- Super admin editor (extend existing `/admins` area or a dedicated super-admin
  org screen) to create/edit orgs and their `textBlocks` with content plus
  styling: color, font size, weight, alignment, variant (heading/paragraph/verse).
- Rendered top-to-bottom on the org landing page.
- Gated to `SUPERADMIN_EMAILS` (`src/config/roles.js`).

### Org admin page

- `/:orgSlug/admin` prompts for the org's `adminCode`.
- On match (checked client-side against the org doc), shows the day-wise voter
  list from `orgs/{orgId}/votes`.
- Same client-side trust model as the existing `1305` code.

## Security note (accepted)

Per-org codes and localStorage names are client-side trust, identical in
strength to the current `1305` mechanism. A technical user could spoof a name or
read a code from the org doc. Accepted given the audience and consistency with
the existing model.

## Affected / new code (indicative)

- `firebase.json`, `.firebaserc` — second hosting target.
- `src/App.js` — new `/:orgSlug`, `/:orgSlug/counter/:id`, `/:orgSlug/admin`
  routes.
- `src/firebase/intention/add.js`, `get.js` — `orgId` tagging,
  `orgs/{orgId}/votes` writes, org-scoped queries.
- New `src/firebase/org/` — org CRUD and vote queries.
- New pages: org landing, org admin (voter list), super-admin org editor.
- New voter-name dialog component + `localStorage` helper.
- Counter page — org-branded variant (suppress `ChapelFooter`/branding).
```

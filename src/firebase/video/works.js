import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { DB } from "../../config/firebase";
import { STAGE_STATUS, VIDEO_STATUS } from "../../utils/videoWorkflow";
import { VIDEO_STEPS } from "../../utils/videoSteps";

const VIDEOS = "videos";
const WORKS = "works";

// Deterministic id — one work doc per (video, step). Lets us read every step of a
// video by id inside a transaction (the web SDK can't run queries in one) and makes
// writes idempotent.
export const workId = (videoId, stageId) => `${videoId}_${stageId}`;

const workRef = (videoId, stageId) => doc(DB, WORKS, workId(videoId, stageId));
const videoRef = (id) => doc(DB, VIDEOS, id);

// Live works for one video (for the timeline). Returns an array of work docs;
// untouched steps simply have no doc.
export const subscribeVideoWorks = (videoId, cb) =>
  onSnapshot(query(collection(DB, WORKS), where("videoId", "==", videoId)), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

// Live works assigned to one crew member. We fetch all their works with a single
// equality (no composite index) and let the caller filter out done ones.
export const subscribeMyWorks = (assigneeId, cb) =>
  onSnapshot(query(collection(DB, WORKS), where("assigneeId", "==", assigneeId)), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

// The single door for every work write (assign / start / done / reopen / note).
// Atomically updates the one work and recomputes the video's doneCount + status
// from scratch, so the rollup can never drift. A work that ends up pending with no
// assignee and no note is deleted to keep the collection lean.
// `lastUpdatedFrom` records which surface made the write — "admin" (the video
// detail screen) or "crew" (the crew member's own screen) — so a note can be
// attributed without guessing from the writer's email.
export const updateWork = async (videoId, stageId, patch, adminEmail, lastUpdatedFrom = "") => {
  await runTransaction(DB, async (tx) => {
    const vRef = videoRef(videoId);
    // All reads first (transaction rule). Read the video + every step's work doc.
    const vSnap = await tx.get(vRef);
    if (!vSnap.exists()) {
      throw new Error("Video not found.");
    }
    const stepSnaps = {};
    for (const step of VIDEO_STEPS) {
      // eslint-disable-next-line no-await-in-loop
      stepSnaps[step.id] = await tx.get(workRef(videoId, step.id));
    }

    const existing = stepSnaps[stageId].exists() ? stepSnaps[stageId].data() : {};
    // The note attribution (who wrote it + when) tracks the note only — a status
    // change or reassignment must not re-stamp it, so it's frozen unless the note
    // text actually changes.
    const noteChanged = patch.note !== undefined && patch.note !== (existing.note || "");
    const next = {
      videoId,
      stageId,
      assigneeId: patch.assigneeId !== undefined ? patch.assigneeId : existing.assigneeId || null,
      status: patch.status !== undefined ? patch.status : existing.status || STAGE_STATUS.PENDING,
      note: patch.note !== undefined ? patch.note : existing.note || "",
      dueDate: patch.dueDate !== undefined ? patch.dueDate : existing.dueDate || null,
      completedAt: existing.completedAt || null,
      updatedBy: adminEmail || "",
      lastUpdatedFrom: noteChanged ? lastUpdatedFrom || "" : existing.lastUpdatedFrom || "",
      noteUpdatedAt: noteChanged ? Date.now() : existing.noteUpdatedAt || null,
      updatedAt: Date.now(),
    };
    if (next.status === STAGE_STATUS.DONE && existing.status !== STAGE_STATUS.DONE) {
      next.completedAt = Date.now();
    } else if (next.status !== STAGE_STATUS.DONE) {
      next.completedAt = null;
    }

    // When the step entered its current state — stamped on the first write (doc
    // created) and on every status change, so the timeline can show "started" /
    // "changed" times the way Done shows its completion time. A note or due-date
    // edit that doesn't move the status leaves it untouched.
    const isNewDoc = !stepSnaps[stageId].exists();
    const statusChanged = next.status !== (existing.status || STAGE_STATUS.PENDING);
    next.statusChangedAt =
      isNewDoc || statusChanged ? Date.now() : existing.statusChangedAt || null;

    // Assignment attribution — stamped when the work gets a (new) assignee, so the
    // crew member can see who handed them the work and when. Frozen once set unless
    // the assignee actually changes; cleared if the assignee is removed.
    const assigneeChanged = next.assigneeId !== (existing.assigneeId || null);
    if (next.assigneeId && assigneeChanged) {
      next.assignedBy = adminEmail || "";
      next.assignedAt = Date.now();
    } else if (!next.assigneeId) {
      next.assignedBy = "";
      next.assignedAt = null;
    } else {
      next.assignedBy = existing.assignedBy || "";
      next.assignedAt = existing.assignedAt || null;
    }

    const isEmpty =
      next.status === STAGE_STATUS.PENDING && !next.assigneeId && !next.note && !next.dueDate;

    // Recompute the rollup from the post-change state of all steps (absolute count,
    // never +/- 1 → self-healing).
    let doneCount = 0;
    for (const step of VIDEO_STEPS) {
      const status =
        step.id === stageId
          ? next.status
          : stepSnaps[step.id].exists()
            ? stepSnaps[step.id].data().status
            : STAGE_STATUS.PENDING;
      if (status === STAGE_STATUS.DONE) doneCount += 1;
    }

    // Writes.
    if (isEmpty) {
      if (stepSnaps[stageId].exists()) tx.delete(workRef(videoId, stageId));
    } else {
      tx.set(workRef(videoId, stageId), next);
    }
    const isComplete = doneCount === VIDEO_STEPS.length;
    const wasComplete = vSnap.data().status === VIDEO_STATUS.COMPLETED;
    tx.update(vRef, {
      doneCount,
      status: isComplete ? VIDEO_STATUS.COMPLETED : VIDEO_STATUS.ACTIVE,
      // Stamp the completion (≈ upload) time once, on the transition to done.
      // Cleared if the video is reopened so a later re-completion re-stamps it.
      ...(isComplete
        ? wasComplete
          ? {}
          : { completedAt: serverTimestamp() }
        : { completedAt: null }),
      updatedAt: serverTimestamp(),
    });
  });
};

// Assignee ids that have at least one open (not-done) work — i.e. crew members
// currently occupied. One-shot read of the whole collection, filtered client-side.
export const listOccupiedAssigneeIds = async () => {
  const snap = await getDocs(collection(DB, WORKS));
  const occupied = new Set();
  snap.docs.forEach((d) => {
    const w = d.data();
    if (w.assigneeId && w.status !== STAGE_STATUS.DONE) {
      occupied.add(w.assigneeId);
    }
  });
  return occupied;
};

// Number of open (not-done) works per assignee id, as a plain object
// { [assigneeId]: count }. Used to show each crew member's current load.
export const listOpenWorkCountsByAssignee = async () => {
  const snap = await getDocs(collection(DB, WORKS));
  const counts = {};
  snap.docs.forEach((d) => {
    const w = d.data();
    if (w.assigneeId && w.status !== STAGE_STATUS.DONE) {
      counts[w.assigneeId] = (counts[w.assigneeId] || 0) + 1;
    }
  });
  return counts;
};

// Delete every work doc belonging to a video (used when the video is deleted).
export const deleteWorksForVideo = async (videoId) => {
  const snap = await getDocs(query(collection(DB, WORKS), where("videoId", "==", videoId)));
  if (snap.empty) return;
  const batch = writeBatch(DB);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

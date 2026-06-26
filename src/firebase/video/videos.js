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
import { DB } from "../../config/firebase";
import { VIDEO_STATUS } from "../../utils/videoWorkflow";
import { deleteWorksForVideo } from "./works";

const VIDEOS = "videos";

const videoRef = (id) => doc(DB, VIDEOS, id);

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

export const getVideo = async (id) => {
  const snapshot = await getDoc(videoRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const subscribeVideo = (id, cb) =>
  onSnapshot(videoRef(id), (snapshot) => {
    cb(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });

// A new video carries only metadata + a zeroed rollup. Its steps live in code
// (videoSteps.js) and become work docs lazily, the first time each is assigned.
export const addVideo = async ({ title, createdBy }) => {
  const trimmed = (title || "").trim();
  if (!trimmed) {
    throw new Error("Video title is required.");
  }
  const ref = await addDoc(collection(DB, VIDEOS), {
    title: trimmed,
    status: VIDEO_STATUS.ACTIVE,
    doneCount: 0,
    createdBy: createdBy || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateVideoMeta = async (id, patch) => {
  await updateDoc(videoRef(id), { ...patch, updatedAt: serverTimestamp() });
};

// Reject a video (e.g. after a content check, or before any processing). Leaves
// the step/work docs untouched — rejection just flips status. An optional remark
// is written to the same `remarks` field shown on the detail page; an empty remark
// is ignored so it never wipes an existing one.
export const rejectVideo = async (id, { remarks } = {}, by = "") => {
  const patch = {
    status: VIDEO_STATUS.REJECTED,
    rejectedAt: serverTimestamp(),
    rejectedBy: by,
    updatedAt: serverTimestamp(),
  };
  const trimmed = (remarks || "").trim();
  if (trimmed) {
    patch.remarks = trimmed;
  }
  await updateDoc(videoRef(id), patch);
};

// Reverse a rejection — back to Active, clearing the rejection stamp.
export const reactivateVideo = async (id) => {
  await updateDoc(videoRef(id), {
    status: VIDEO_STATUS.ACTIVE,
    rejectedAt: null,
    updatedAt: serverTimestamp(),
  });
};

export const deleteVideo = async (id) => {
  await deleteWorksForVideo(id);
  await deleteDoc(videoRef(id));
};

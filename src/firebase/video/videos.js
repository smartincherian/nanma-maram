import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";
import {
  STAGE_STATUS,
  VIDEO_STATUS,
  deriveStatus,
} from "../../utils/videoWorkflow";

const VIDEOS = "videos";

const toMillis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : value || 0;

const videoRef = (id) => doc(DB, VIDEOS, id);

// Active videos first, then most recently created.
const sortVideos = (videos) =>
  videos.sort((a, b) => {
    const aActive = a.status === VIDEO_STATUS.ACTIVE ? 0 : 1;
    const bActive = b.status === VIDEO_STATUS.ACTIVE ? 0 : 1;
    if (aActive !== bActive) {
      return aActive - bActive;
    }
    return toMillis(b.createdAt) - toMillis(a.createdAt);
  });

export const listVideos = async () => {
  const snapshot = await getDocs(collection(DB, VIDEOS));
  return sortVideos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
};

export const getVideo = async (id) => {
  const snapshot = await getDoc(videoRef(id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const subscribeVideo = (id, cb) =>
  onSnapshot(videoRef(id), (snapshot) => {
    cb(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });

export const addVideo = async ({
  title,
  typeId,
  typeName,
  priority,
  targetDate,
  sourceLink,
  stages,
  createdBy,
}) => {
  const trimmed = (title || "").trim();
  if (!trimmed) {
    throw new Error("Video title is required.");
  }
  const ref = await addDoc(collection(DB, VIDEOS), {
    title: trimmed,
    typeId: typeId || "",
    typeName: typeName || "",
    priority: priority || "normal",
    targetDate: targetDate || null,
    sourceLink: (sourceLink || "").trim(),
    status: deriveStatus(stages || []),
    stages: stages || [],
    createdBy: createdBy || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateVideoMeta = async (id, patch) => {
  await updateDoc(videoRef(id), { ...patch, updatedAt: serverTimestamp() });
};

export const deleteVideo = async (id) => {
  await deleteDoc(videoRef(id));
};

// Atomically update a single stage and recompute the video's status, mirroring
// the transactional pattern used by addCounter.
export const updateVideoStage = async (videoId, stageId, patch, adminEmail) => {
  await runTransaction(DB, async (tx) => {
    const ref = videoRef(videoId);
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) {
      throw new Error("Video not found.");
    }
    const data = snapshot.data();
    const stages = (data.stages || []).map((stage) => {
      if (stage.stageId !== stageId) {
        return stage;
      }
      const next = { ...stage, ...patch, updatedBy: adminEmail || "", updatedAt: Date.now() };
      if (patch.status === STAGE_STATUS.DONE && stage.status !== STAGE_STATUS.DONE) {
        next.completedAt = Date.now();
      } else if (patch.status && patch.status !== STAGE_STATUS.DONE) {
        next.completedAt = null;
      }
      return next;
    });

    tx.update(ref, {
      stages,
      status: deriveStatus(stages),
      updatedAt: serverTimestamp(),
    });
  });
};

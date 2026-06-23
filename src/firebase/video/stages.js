import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const STAGES = "videoStages";

const toMillis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : value || 0;

export const listStages = async () => {
  const snapshot = await getDocs(collection(DB, STAGES));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        toMillis(a.createdAt) - toMillis(b.createdAt)
    );
};

export const addStage = async ({ name }) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("Stage name is required.");
  }
  const existing = await getDocs(collection(DB, STAGES));
  await addDoc(collection(DB, STAGES), {
    name: trimmed,
    order: existing.size,
    createdAt: serverTimestamp(),
  });
};

export const updateStage = async (id, { name }) => {
  await updateDoc(doc(DB, STAGES, id), { name: (name || "").trim() });
};

// Delete a step. Existing videos keep their own snapshot of steps, so this only
// affects which steps new videos get.
export const deleteStage = async (id) => {
  await deleteDoc(doc(DB, STAGES, id));
};

export const reorderStages = async (orderedIds) => {
  const batch = writeBatch(DB);
  orderedIds.forEach((id, index) => {
    batch.update(doc(DB, STAGES, id), { order: index });
  });
  await batch.commit();
};

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const TYPES = "videoTypes";

const toMillis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : value || 0;

export const listTypes = async () => {
  const snapshot = await getDocs(collection(DB, TYPES));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
};

export const addType = async ({ name, stageIds }) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("Type name is required.");
  }
  await addDoc(collection(DB, TYPES), {
    name: trimmed,
    stageIds: stageIds || [],
    createdAt: serverTimestamp(),
  });
};

export const updateType = async (id, { name, stageIds }) => {
  await updateDoc(doc(DB, TYPES, id), {
    name: (name || "").trim(),
    stageIds: stageIds || [],
  });
};

export const deleteType = async (id) => {
  await deleteDoc(doc(DB, TYPES, id));
};

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

const CREW = "videoCrew";

const toMillis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : value || 0;

export const listCrew = async () => {
  const snapshot = await getDocs(collection(DB, CREW));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
};

export const addCrew = async ({ name, skills, linkedEmail }) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("Crew member name is required.");
  }
  await addDoc(collection(DB, CREW), {
    name: trimmed,
    skills: skills || [],
    linkedEmail: (linkedEmail || "").trim().toLowerCase(),
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateCrew = async (id, { name, skills, linkedEmail, active }) => {
  await updateDoc(doc(DB, CREW, id), {
    name: (name || "").trim(),
    skills: skills || [],
    linkedEmail: (linkedEmail || "").trim().toLowerCase(),
    active: active !== false,
  });
};

export const deleteCrew = async (id) => {
  await deleteDoc(doc(DB, CREW, id));
};

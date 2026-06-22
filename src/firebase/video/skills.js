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

const SKILLS = "videoSkills";

const toMillis = (value) =>
  value && typeof value.toMillis === "function" ? value.toMillis() : value || 0;

export const listSkills = async () => {
  const snapshot = await getDocs(collection(DB, SKILLS));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
};

export const addSkill = async ({ name }) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("Skill name is required.");
  }
  await addDoc(collection(DB, SKILLS), {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
};

export const updateSkill = async (id, { name }) => {
  await updateDoc(doc(DB, SKILLS, id), { name: (name || "").trim() });
};

export const deleteSkill = async (id) => {
  await deleteDoc(doc(DB, SKILLS, id));
};

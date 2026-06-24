import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
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

export const addCrew = async ({ name, skills, email }) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("Crew member name is required.");
  }
  await addDoc(collection(DB, CREW), {
    name: trimmed,
    skills: skills || [],
    email: (email || "").trim().toLowerCase(),
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateCrew = async (id, { name, skills, email, phone, active }) => {
  await updateDoc(doc(DB, CREW, id), {
    name: (name || "").trim(),
    skills: skills || [],
    email: (email || "").trim().toLowerCase(),
    phone: (phone || "").trim(),
    active: active !== false,
  });
};

export const deleteCrew = async (id) => {
  await deleteDoc(doc(DB, CREW, id));
};

export const fetchCrewByEmail = async (email) => {
  if (!email) {
    return null;
  }
  const snapshot = await getDoc(doc(DB, CREW, email.trim().toLowerCase()));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...snapshot.data() };
};

export const registerCrew = async ({ email, name, phone, skills }) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanName = (name || "").trim();
  const cleanPhone = (phone || "").trim();
  const cleanSkills = Array.isArray(skills) ? skills : [];
  if (!cleanEmail) throw new Error("Email is required.");
  if (!cleanName) throw new Error("Name is required.");
  if (!cleanPhone) throw new Error("Phone number is required.");
  if (cleanSkills.length === 0) throw new Error("Pick at least one skill.");
  await setDoc(doc(DB, CREW, cleanEmail), {
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    skills: cleanSkills,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const setCrewActive = async (id, active) => {
  await updateDoc(doc(DB, CREW, id), { active });
};

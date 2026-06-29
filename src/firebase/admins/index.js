import {
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

const ADMINS_COLLECTION = "admins";

const adminDoc = (email) => doc(DB, ADMINS_COLLECTION, email.toLowerCase());

// createdAt may be a Firestore Timestamp (with toMillis) or a raw number.
const toMillis = (value) =>
  value && typeof value.toMillis === "function"
    ? value.toMillis()
    : value || 0;

const mapAndSort = (snapshot) =>
  snapshot.docs
    .map((d) => ({ email: d.id, ...d.data() }))
    .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));

export const listAdmins = async () => {
  const snapshot = await getDocs(collection(DB, ADMINS_COLLECTION));
  return mapAndSort(snapshot);
};

export const addAdmin = async ({ email, name, contact }) => {
  if (!email || !name) {
    throw new Error("Email and name are required.");
  }

  const ref = adminDoc(email);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error("An admin with this email already exists.");
  }

  await setDoc(ref, {
    name,
    contact: contact || "",
    role: "admin",
    createdAt: serverTimestamp(),
  });
};

export const updateAdmin = async (email, { name, contact }) => {
  await updateDoc(adminDoc(email), {
    name,
    contact: contact || "",
  });
};

export const deleteAdmin = async (email) => {
  await deleteDoc(adminDoc(email));
};

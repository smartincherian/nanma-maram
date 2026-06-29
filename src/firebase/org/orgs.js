import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "orgs");

const toOrg = (snap) => ({ id: snap.id, ...snap.data() });

export const listOrgs = async () => {
  const snapshot = await getDocs(ref);
  return snapshot.docs
    .map(toOrg)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
};

export const getOrgBySlug = async (slug) => {
  const cleaned = String(slug || "").trim().toLowerCase();
  if (!cleaned) return null;
  const q = query(ref, where("slug", "==", cleaned), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : toOrg(snapshot.docs[0]);
};

export const getOrgById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(ref, id));
  return snap.exists() ? toOrg(snap) : null;
};

export const createOrg = async (data) => {
  const {
    slug = "",
    name = "",
    adminCode = "",
    primaryColor = "#4a148c",
    textBlocks = [],
  } = data || {};
  const created = await addDoc(ref, {
    slug: String(slug).trim().toLowerCase(),
    name: String(name).trim(),
    adminCode: String(adminCode).trim(),
    primaryColor,
    textBlocks: Array.isArray(textBlocks) ? textBlocks : [],
    createdAt: Date.now(),
  });
  return created.id;
};

export const updateOrg = async (id, data) => {
  const {
    slug = "",
    name = "",
    adminCode = "",
    primaryColor = "#4a148c",
    textBlocks = [],
  } = data || {};
  await updateDoc(doc(ref, id), {
    slug: String(slug).trim().toLowerCase(),
    name: String(name).trim(),
    adminCode: String(adminCode).trim(),
    primaryColor,
    textBlocks: Array.isArray(textBlocks) ? textBlocks : [],
    updatedAt: Date.now(),
  });
};

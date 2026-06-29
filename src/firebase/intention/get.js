import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "intentions");

export const getIntentionById = async (id) => {
  if (!id) return null;
  try {
    const snap = await getDoc(doc(ref, id));
    return snap.exists() ? { ...snap.data(), id: snap.id } : null;
  } catch (error) {
    console.error("getIntentionById :", error);
    throw error;
  }
};

export const fetchIntentions = async () => {
  try {
    const querySnapshot = await getDocs(ref);
    const response = querySnapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .filter((item) => !item.orgId);
    return response || [];
  } catch (error) {
    console.error("fetchIntentions :", error);
    throw error;
  }
};
export const fetchUpdates = async () => {
  try {
    const updateRef = collection(DB, "rosaryUpdates");
    const querySnapshot = await getDocs(updateRef);
    const response = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    return response || [];
  } catch (error) {
    console.error("fetchUpdates :", error);
    throw error;
  }
};
export const listOrgIntentions = async (orgId) => {
  if (!orgId) return [];
  try {
    const q = query(ref, where("orgId", "==", orgId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch (error) {
    console.error("listOrgIntentions :", error);
    throw error;
  }
};

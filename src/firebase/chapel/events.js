import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "chapelEvents");

export const fetchEvents = async () => {
  const eventsQuery = query(ref, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(eventsQuery);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

export const fetchEvent = async (eventId) => {
  const snapshot = await getDoc(doc(ref, eventId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

// Live subscription to a single event document.
export const subscribeEvent = (eventId, onChange, onError) =>
  onSnapshot(
    doc(ref, eventId),
    (snapshot) => {
      onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    (error) => {
      console.error("Error subscribeEvent:", error);
      if (onError) onError(error);
    }
  );

export const createEvent = async (data) => {
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateEvent = async (eventId, data) => {
  await setDoc(
    doc(ref, eventId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
};

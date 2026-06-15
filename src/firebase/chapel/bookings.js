import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "chapelBookings");

// One-time read of every booking for one event on one date (for the leader's
// "view all bookings" / export screen — no live subscription needed there).
export const fetchBookings = async ({ eventId, date }) => {
  const bookingsQuery = query(
    ref,
    where("eventId", "==", eventId),
    where("date", "==", date)
  );
  const snapshot = await getDocs(bookingsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

// Live subscription to every booking for one event on one date. Scoped tight
// (eventId + date) so reads stay minimal — see design notes on onSnapshot cost.
export const subscribeBookings = ({ eventId, date }, onChange, onError) => {
  const bookingsQuery = query(
    ref,
    where("eventId", "==", eventId),
    where("date", "==", date)
  );
  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      );
    },
    (error) => {
      console.error("Error subscribeBookings:", error);
      if (onError) onError(error);
    }
  );
};

export const addBooking = async (booking) => {
  const docRef = await addDoc(ref, {
    ...booking,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteBooking = async (bookingId) => {
  await deleteDoc(doc(ref, bookingId));
};

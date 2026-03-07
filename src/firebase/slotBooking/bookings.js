import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "slotBookings");

export const fetchBookingsInRange = async ({ startMs, endMs }) => {
  try {
    const bookingsQuery = query(
      ref,
      where("startMs", ">=", startMs),
      where("startMs", "<=", endMs),
      orderBy("startMs", "asc")
    );
    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error("Error fetchBookingsInRange:", error);
    throw error;
  }
};

export const createBookings = async ({ bookings }) => {
  try {
    const batch = writeBatch(DB);
    bookings.forEach((booking) => {
      const docRef = doc(ref);
      batch.set(docRef, booking);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error createBookings:", error);
    throw error;
  }
};

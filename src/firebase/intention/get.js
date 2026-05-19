import { collection, getDocs } from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "intentions");

export const fetchIntentions = async () => {
  try {
    const querySnapshot = await getDocs(ref);
    const response = querySnapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
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

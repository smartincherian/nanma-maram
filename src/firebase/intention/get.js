import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "intentions");

export const fetchIntentions = async () => {
  try {
    const q = query(ref, orderBy("createdAt"));
    const querySnapshot = await getDocs(q);
    let response = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    return response || [];
  } catch (error) {
    console.error("fetchIntentions :", error);
    throw error;
  }
};

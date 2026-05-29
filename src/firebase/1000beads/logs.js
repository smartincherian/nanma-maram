import {
  collection,
  doc,
  getDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const addCollectionName = "1000beads_logs_add";
const reduceCollectionName = "1000beads_logs_reduce";

export const checkExisting = async ({ group, date, action, key }) => {
  try {
    const collectionName =
      action === "reduce" ? reduceCollectionName : addCollectionName;
    const ref = doc(DB, collectionName, date);
    const docSnap = await getDoc(ref);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const groups = data.groups || [];

      if (groups.includes(group)) {
        console.log("Group already exists in array");
      } else {
        console.log("Group not found, adding to array");
      }
    } else {
      console.log("Document does not exist, creating...");
    }

    return { success: true, message: "Ave Maria 🙏 Count added successfully" };
  } catch (error) {
    console.error("Error checkExisting:", error);
    throw error;
  }
};

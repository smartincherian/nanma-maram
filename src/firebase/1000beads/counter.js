import { collection, doc, increment, updateDoc } from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "1000beads");

export const plusCounter = async (mystery) => {
  try {
    await updateDoc(doc(ref, "extra"), {
      [mystery]: increment(1),
    });
    return { success: true, message: "Ave Maria 🙏 Count added successfully" };
  } catch (error) {
    console.error("Error plusCounter:", error);
    throw error;
  }
};

export const minusCounter = async (mystery) => {
  try {
    await updateDoc(doc(ref, "extra"), {
      [mystery]: increment(-1),
    });
    return { success: true, message: "Ave Maria 🙏 Count taken successfully" };
  } catch (error) {
    console.error("Error minusCounter:", error);
    throw error;
  }
};

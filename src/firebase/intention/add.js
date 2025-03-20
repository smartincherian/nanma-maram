import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "intentions");
const MAX_INCREMENT_ROSARY = 25;

export const addIntention = async (data) => {
  try {
    const { intention = "", maxCount = 0, prayerType = "", path = "" } = data;
    const convertedData = {
      intention,
      maxCount: Number(maxCount),
      prayerType,
      createdAt: Date.now(),
      count: 0,
    };
    if (path === "mother") {
      convertedData.isMotherIntention = true;
    }
    await addDoc(ref, convertedData);
  } catch (error) {
    console.error("Error addIntention:", error);
    throw error;
  }
};

export const addCounter = async (data) => {
  try {
    const { id = "", value = 0, user = "" } = data;
    const numericValue = Number(value);

    if (id === "MLN45oPgcMqOzdgxXLmI" && value > MAX_INCREMENT_ROSARY) {
      throw new Error(
        `Please check the value, Cannot increment Rosary count by ${value}`
      );
    }

    const collectionName =
      id === "MLN45oPgcMqOzdgxXLmI"
        ? "rosaryUpdates"
        : id === "rTZBd2UGY1ZL5eYZuDsP"
        ? "hailMaryUpdates"
        : "otherUpdates";
    await updateDoc(doc(ref, id), {
      count: increment(numericValue),
    });
    const updateRef = collection(DB, collectionName);
    await addDoc(updateRef, {
      newCount: value,
      timestamp: serverTimestamp(),
      user,
    });
    return { success: true, message: "Ave Maria 🙏 Count added successfully" };
  } catch (error) {
    console.error("Error addCounter:", error);
    throw error;
  }
};

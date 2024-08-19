import {
  addDoc,
  collection,
  doc,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "intentions");

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
    const { id = "", value = 0 } = data;
    await updateDoc(doc(ref, id), {
      count: increment(value),
    });
  } catch (error) {
    console.error("Error addCounter:", error);
    throw error;
  }
};

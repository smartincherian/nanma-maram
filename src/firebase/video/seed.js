import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

// One-time sample data. Each collection is only seeded when it is currently
// empty, so running this twice will not create duplicates.

const STEPS = [
  "Video Collection",
  "Content Check Before Editing",
  "Caption Creation",
  "Assign for Editing & Update Editor Details",
  "Collect Edited Videos",
];

const CREW = [
  "Binla", "Feba", "Lincy", "Sharon", "Hima", "Akhila", "Siljo", "Alphina",
  "Bibin", "Hena", "Savio", "Grace Angeleena", "Rony Thomas", "Amal",
  "Shilna Vipin", "Roy", "Tieny", "Abin", "Shilo", "Precious", "Stephy",
  "Angel", "Jisna Mary", "Steeven", "Amala Saji", "Sheniya", "Sneha Thomas",
  "Jesna Thomas", "Retty", "Keziah", "Kiran Joseph", "Sheenu", "Edwin Mathew",
  "Alwin",
];

const isEmpty = async (name) => {
  const snapshot = await getDocs(collection(DB, name));
  return snapshot.empty;
};

export const seedVideoData = async () => {
  if (await isEmpty("videoStages")) {
    let order = 0;
    for (const name of STEPS) {
      await addDoc(collection(DB, "videoStages"), {
        name,
        order: order++,
        createdAt: serverTimestamp(),
      });
    }
  }

  if (await isEmpty("videoCrew")) {
    for (const name of CREW) {
      await addDoc(collection(DB, "videoCrew"), {
        name,
        active: true,
        createdAt: serverTimestamp(),
      });
    }
  }
};

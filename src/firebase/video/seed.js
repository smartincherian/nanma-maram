import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

// One-time sample data matching the spec. Each collection is only seeded when
// it is currently empty, so running this twice will not create duplicates.

const SKILLS = [
  { key: "short", name: "Short Video" },
  { key: "long", name: "Long Video" },
  { key: "poster", name: "Poster" },
  { key: "thumbnail", name: "Thumbnail" },
  { key: "promo", name: "Promo" },
];

const STAGES = [
  "Source Video",
  "Video Check",
  "Edit",
  "Poster",
  "Thumbnail",
  "YouTube Upload",
];

const TYPES = [
  { name: "Short Video", stages: ["Source Video", "Video Check", "Edit", "Thumbnail", "YouTube Upload"] },
  { name: "Long Video", stages: ["Source Video", "Video Check", "Edit", "Thumbnail", "YouTube Upload"] },
  { name: "Promo", stages: ["Source Video", "Video Check", "Edit", "Poster", "Thumbnail", "YouTube Upload"] },
];

const CREW = [
  { name: "Binla", skills: ["short"] },
  { name: "Feba", skills: ["short"] },
  { name: "Lincy", skills: ["short"] },
  { name: "Sharon", skills: ["short"] },
  { name: "Hima", skills: ["long", "short"] },
  { name: "Akhila", skills: ["short"] },
  { name: "Siljo", skills: ["long"] },
  { name: "Alphina", skills: ["thumbnail", "promo", "short"] },
  { name: "Bibin", skills: ["short", "long"] },
  { name: "Hena", skills: ["short", "poster", "thumbnail"] },
  { name: "Savio", skills: ["short", "long"] },
  { name: "Grace Angeleena", skills: ["short"] },
  { name: "Rony Thomas", skills: ["thumbnail", "poster"] },
  { name: "Amal", skills: ["short"] },
  { name: "Shilna Vipin", skills: ["short"] },
  { name: "Roy", skills: ["short", "long"] },
  { name: "Tieny", skills: ["short", "thumbnail"] },
  { name: "Abin", skills: ["short", "long", "thumbnail"] },
  { name: "Shilo", skills: ["thumbnail", "poster"] },
  { name: "Precious", skills: ["poster"] },
  { name: "Stephy", skills: ["short"] },
  { name: "Angel", skills: ["short", "long", "poster"] },
  { name: "Jisna Mary", skills: ["short", "thumbnail"] },
  { name: "Steeven", skills: ["short", "long", "thumbnail"] },
  { name: "Amala Saji", skills: ["short", "long"] },
  { name: "Sheniya", skills: ["short", "long"] },
  { name: "Sneha Thomas", skills: ["short", "long"] },
  { name: "Jesna Thomas", skills: ["promo", "short", "thumbnail", "poster"] },
  { name: "Retty", skills: ["short"] },
  { name: "Keziah", skills: ["poster", "thumbnail", "short"] },
  { name: "Kiran Joseph", skills: ["short", "long"] },
  { name: "Sheenu", skills: ["short"] },
  { name: "Edwin Mathew", skills: ["short", "long", "poster", "thumbnail", "promo"] },
  { name: "Alwin", skills: ["short", "long", "promo"] },
];

const isEmpty = async (name) => {
  const snapshot = await getDocs(collection(DB, name));
  return snapshot.empty;
};

export const seedVideoData = async () => {
  // Skills
  const skillIdByKey = {};
  if (await isEmpty("videoSkills")) {
    for (const skill of SKILLS) {
      const ref = await addDoc(collection(DB, "videoSkills"), {
        name: skill.name,
        createdAt: serverTimestamp(),
      });
      skillIdByKey[skill.key] = ref.id;
    }
  } else {
    const existing = await getDocs(collection(DB, "videoSkills"));
    existing.docs.forEach((d) => {
      const match = SKILLS.find((s) => s.name === d.data().name);
      if (match) {
        skillIdByKey[match.key] = d.id;
      }
    });
  }

  // Stages
  const stageIdByName = {};
  if (await isEmpty("videoStages")) {
    let order = 0;
    for (const name of STAGES) {
      const ref = await addDoc(collection(DB, "videoStages"), {
        name,
        order: order++,
        createdAt: serverTimestamp(),
      });
      stageIdByName[name] = ref.id;
    }
  } else {
    const existing = await getDocs(collection(DB, "videoStages"));
    existing.docs.forEach((d) => {
      stageIdByName[d.data().name] = d.id;
    });
  }

  // Types
  if (await isEmpty("videoTypes")) {
    for (const type of TYPES) {
      await addDoc(collection(DB, "videoTypes"), {
        name: type.name,
        stageIds: type.stages
          .map((n) => stageIdByName[n])
          .filter(Boolean),
        createdAt: serverTimestamp(),
      });
    }
  }

  // Crew
  if (await isEmpty("videoCrew")) {
    for (const member of CREW) {
      await addDoc(collection(DB, "videoCrew"), {
        name: member.name,
        skills: member.skills.map((k) => skillIdByKey[k]).filter(Boolean),
        linkedEmail: "",
        active: true,
        createdAt: serverTimestamp(),
      });
    }
  }
};

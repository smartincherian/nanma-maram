/**
 * One-time seeder for the Video Tracking feature.
 *
 * Populates the videoSkills, videoStages, videoTypes and videoCrew collections
 * with the default stages, types, work skills and the 34 crew members.
 *
 * Idempotent: each collection is only written when it is currently empty, so
 * re-running this will not create duplicates.
 *
 * Usage (from the project root):
 *   node scripts/seedVideoData.mjs
 *
 * Requires the project deps (firebase) to be installed, and that your Firestore
 * security rules allow these writes from a client. This uses the same public
 * web config the app ships with.
 */
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAbFDpXK0QR_FWOb2w_s6aJ5excg-qEZ8",
  authDomain: "nanma-maram.firebaseapp.com",
  projectId: "nanma-maram",
  storageBucket: "nanma-maram.firebasestorage.app",
  messagingSenderId: "611147027871",
  appId: "1:611147027871:web:60dc53927ca18fbfd2d9aa",
};

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const isEmpty = async (name) => (await getDocs(collection(db, name))).empty;

const run = async () => {
  // Skills
  const skillIdByKey = {};
  if (await isEmpty("videoSkills")) {
    for (const skill of SKILLS) {
      const ref = await addDoc(collection(db, "videoSkills"), {
        name: skill.name,
        createdAt: serverTimestamp(),
      });
      skillIdByKey[skill.key] = ref.id;
    }
    console.log(`✓ Seeded ${SKILLS.length} skills`);
  } else {
    const existing = await getDocs(collection(db, "videoSkills"));
    existing.docs.forEach((d) => {
      const match = SKILLS.find((s) => s.name === d.data().name);
      if (match) skillIdByKey[match.key] = d.id;
    });
    console.log("• Skills already present — skipped");
  }

  // Stages
  const stageIdByName = {};
  if (await isEmpty("videoStages")) {
    let order = 0;
    for (const name of STAGES) {
      const ref = await addDoc(collection(db, "videoStages"), {
        name,
        order: order++,
        createdAt: serverTimestamp(),
      });
      stageIdByName[name] = ref.id;
    }
    console.log(`✓ Seeded ${STAGES.length} stages`);
  } else {
    const existing = await getDocs(collection(db, "videoStages"));
    existing.docs.forEach((d) => {
      stageIdByName[d.data().name] = d.id;
    });
    console.log("• Stages already present — skipped");
  }

  // Types
  if (await isEmpty("videoTypes")) {
    for (const type of TYPES) {
      await addDoc(collection(db, "videoTypes"), {
        name: type.name,
        stageIds: type.stages.map((n) => stageIdByName[n]).filter(Boolean),
        createdAt: serverTimestamp(),
      });
    }
    console.log(`✓ Seeded ${TYPES.length} types`);
  } else {
    console.log("• Types already present — skipped");
  }

  // Crew
  if (await isEmpty("videoCrew")) {
    for (const member of CREW) {
      await addDoc(collection(db, "videoCrew"), {
        name: member.name,
        skills: member.skills.map((k) => skillIdByKey[k]).filter(Boolean),
        linkedEmail: "",
        active: true,
        createdAt: serverTimestamp(),
      });
    }
    console.log(`✓ Seeded ${CREW.length} crew members`);
  } else {
    console.log("• Crew already present — skipped");
  }
};

run()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nSeed failed:", err?.code || err?.message || err);
    if (String(err?.code).includes("permission-denied")) {
      console.error(
        "Firestore rules rejected the write. Either relax the rules for these\n" +
          "collections, or use the in-app owner-only “Seed sample data” button."
      );
    }
    process.exit(1);
  });

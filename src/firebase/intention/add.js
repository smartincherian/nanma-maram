import {
  addDoc,
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "intentions");
const MAX_INCREMENT_ROSARY = 25;

export const addIntention = async (data) => {
  try {
    const {
      name = "",
      intention = "",
      bibleVerse = "",
      instruction = "",
      maxCount = 0,
      prayerType = "",
      path = "",
      displayTitlePrefix = "",
      displayTitleHighlight = "",
      displayTitleSuffix = "",
      featuredVerse = "",
      featuredQuote = "",
      showLast5AndTop5 = false,
      collectionName = "",
      orgId = null,
      boxes = [],
    } = data;
    const convertedData = {
      name,
      intention,
      bibleVerse,
      instruction,
      maxCount: Number(maxCount),
      prayerType,
      createdAt: Date.now(),
      count: 0,
      displayTitlePrefix,
      displayTitleHighlight,
      displayTitleSuffix,
      featuredVerse,
      featuredQuote,
      showLast5AndTop5: Boolean(showLast5AndTop5),
      collectionName,
      orgId: orgId || null,
      boxes: Array.isArray(boxes) ? boxes : [],
    };
    if (path === "mother") {
      convertedData.isMotherIntention = true;
    }
    const created = await addDoc(ref, convertedData);
    return created.id;
  } catch (error) {
    console.error("Error addIntention:", error);
    throw error;
  }
};

export const addCounter = async (data) => {
  try {
    const { id = "", value = 0, user = "", orgId = "" } = data;
    const numericValue = Number(value);
    const intentionRef = doc(ref, id);

    if (
      id === "MLN45oPgcMqOzdgxXLmI" &&
      numericValue > 0 &&
      numericValue > MAX_INCREMENT_ROSARY
    ) {
      throw new Error(
        `Please check the value, Cannot increment Rosary count by ${numericValue}`
      );
    }

    if (!numericValue) {
      throw new Error("Please enter a valid count");
    }

    const appliedValue = await runTransaction(DB, async (transaction) => {
      const intentionSnapshot = await transaction.get(intentionRef);

      if (!intentionSnapshot.exists()) {
        throw new Error("Intention not found");
      }

      const intentionData = intentionSnapshot.data() || {};
      const configuredCollectionName = String(
        intentionData?.collectionName || ""
      ).trim();
      const fallbackCollectionName =
        id === "MLN45oPgcMqOzdgxXLmI"
          ? "rosaryUpdates"
          : id === "rTZBd2UGY1ZL5eYZuDsP"
          ? "hailMaryUpdates"
          : "otherUpdates";
      const logCollectionName =
        configuredCollectionName || fallbackCollectionName;

      const currentCount = Number(intentionData?.count || 0);

      if (numericValue < 0 && currentCount <= 0) {
        throw new Error("Count is already zero");
      }

      const nextCount = Math.max(0, currentCount + numericValue);
      const safeDelta = nextCount - currentCount;

      if (!safeDelta) {
        throw new Error("Count is already zero");
      }

      transaction.update(intentionRef, {
        count: increment(safeDelta),
      });

      return {
        appliedValue: safeDelta,
        logCollectionName,
      };
    });

    if (orgId) {
      const votesRef = collection(DB, "orgs", orgId, "votes");
      await addDoc(votesRef, {
        intentionId: id,
        voterName: user,
        value: appliedValue.appliedValue,
        timestamp: serverTimestamp(),
      });
    } else {
      const updateRef = collection(DB, appliedValue.logCollectionName);
      await addDoc(updateRef, {
        newCount: appliedValue.appliedValue,
        timestamp: serverTimestamp(),
        user,
      });
    }
    return {
      success: true,
      message:
        appliedValue.appliedValue > 0
          ? "Ave Maria 🙏 Count added successfully"
          : "Ave Maria 🙏 Count reduced successfully",
    };
  } catch (error) {
    console.error("Error addCounter:", error);
    throw error;
  }
};

export const updateIntention = async (id, data) => {
  try {
    const {
      name = "",
      intention = "",
      bibleVerse = "",
      instruction = "",
      maxCount = 0,
      prayerType = "",
      path = "",
      displayTitlePrefix = "",
      displayTitleHighlight = "",
      displayTitleSuffix = "",
      featuredVerse = "",
      featuredQuote = "",
      showLast5AndTop5 = false,
      collectionName = "",
      boxes = [],
    } = data;

    await updateDoc(doc(ref, id), {
      name,
      intention,
      bibleVerse,
      instruction,
      maxCount: path === "mother" ? 0 : Number(maxCount) || 0,
      prayerType,
      displayTitlePrefix,
      displayTitleHighlight,
      displayTitleSuffix,
      featuredVerse,
      featuredQuote,
      showLast5AndTop5: Boolean(showLast5AndTop5),
      collectionName,
      boxes: Array.isArray(boxes) ? boxes : [],
      isMotherIntention: path === "mother",
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error updateIntention:", error);
    throw error;
  }
};

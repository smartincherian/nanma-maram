import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { DB } from "../../config/firebase";

export const listOrgVotes = async (orgId) => {
  if (!orgId) return [];
  const votesRef = collection(DB, "orgs", orgId, "votes");
  const q = query(votesRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() || {};
    const ts = data.timestamp;
    const timestampMs =
      ts && typeof ts.toMillis === "function" ? ts.toMillis() : Date.now();
    return {
      id: doc.id,
      intentionId: data.intentionId || "",
      voterName: data.voterName || "",
      value: Number(data.value || 0),
      timestampMs,
    };
  });
};

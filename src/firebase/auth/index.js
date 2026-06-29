import {
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AUTH, DB, googleProvider } from "../../config/firebase";

// Allowlist collection. Each document's ID is the lowercase email of an
// approved admin. Managed manually in the Firebase Console.
const ADMINS_COLLECTION = "admins";

export const signInWithGoogle = () => signInWithPopup(AUTH, googleProvider);

export const signOutUser = () => signOut(AUTH);

// Returns the admin record ({ email, ...data }) for an allowlisted email,
// or null when the email is not on the allowlist.
export const fetchAdmin = async (email) => {
  if (!email) {
    return null;
  }

  const snapshot = await getDoc(
    doc(DB, ADMINS_COLLECTION, email.toLowerCase())
  );

  if (!snapshot.exists()) {
    return null;
  }

  return { email: snapshot.id, ...snapshot.data() };
};

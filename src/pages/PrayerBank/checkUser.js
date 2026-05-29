import { doc, getDoc, setDoc } from "firebase/firestore";
import { DB } from "../../config/firebase";

// Check if user document exists and verify passcode
export const verifyUserPasscode = async (userId, userPasscode) => {
  try {
    const userDocRef = doc(DB, "prayerBank", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.passcode === userPasscode;
    }
    return false;
  } catch (error) {
    console.error("Error verifying passcode:", error);
    return false;
  }
};

// Register new user with passcode
export const registerUser = async (userId, userName, userPasscode) => {
  try {
    const userDocRef = doc(DB, "prayerBank", userId);

    // Create new user document with passcode and initial data
    await setDoc(userDocRef, {
      name: userName,
      passcode: userPasscode,
      createdAt: new Date().toISOString(),
      customPrayers: {},
    });

    return true;
  } catch (error) {
    console.error("Error registering user:", error);
    return false;
  }
};

// Check if user exists
export const checkUserExists = async (userId) => {
  try {
    const userDocRef = doc(DB, "prayerBank", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists();
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
};

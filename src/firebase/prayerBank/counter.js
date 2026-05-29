import {
  collection,
  doc,
  increment,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { DB } from "../../config/firebase";

const ref = collection(DB, "prayerBank");

export const plusCounter = async (payload = {}) => {
  try {
    const { key, id: userId } = payload;
    const userDocRef = doc(ref, userId);
    
    // Check if document exists, if not create it with default structure
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        [key]: 1,
        createdAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(userDocRef, {
        [key]: increment(1),
      });
    }
    
    return { success: true, message: "Prayer count increased! 🙏" };
  } catch (error) {
    console.error("Error plusCounter:", error);
    throw error;
  }
};

export const minusCounter = async (payload = {}) => {
  try {
    const { key, id: userId } = payload;
    const userDocRef = doc(ref, userId);
    
    await updateDoc(userDocRef, {
      [key]: increment(-1),
    });
    
    return { success: true, message: "Prayer count decreased! 🙏" };
  } catch (error) {
    console.error("Error minusCounter:", error);
    throw error;
  }
};

export const addCustomPrayer = async (payload = {}) => {
  try {
    const { prayerName, id: userId } = payload;
    const userDocRef = doc(ref, userId);
    
    // Generate a unique key for the custom prayer
    const customKey = `custom_${Date.now()}`;
    
    const docSnap = await getDoc(userDocRef);
    
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        customPrayers: {
          [customKey]: {
            name: prayerName,
            count: 0,
            isDefault: false,
            createdAt: new Date().toISOString(),
          }
        },
        createdAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(userDocRef, {
        [`customPrayers.${customKey}`]: {
          name: prayerName,
          count: 0,
          isDefault: false,
          createdAt: new Date().toISOString(),
        }
      });
    }
    
    return { success: true, message: "Custom prayer added! 🙏", customKey };
  } catch (error) {
    console.error("Error addCustomPrayer:", error);
    throw error;
  }
};

export const deleteCustomPrayer = async (payload = {}) => {
  try {
    const { customKey, id: userId } = payload;
    const userDocRef = doc(ref, userId);
    
    await updateDoc(userDocRef, {
      [`customPrayers.${customKey}`]: null
    });
    
    return { success: true, message: "Custom prayer deleted! 🙏" };
  } catch (error) {
    console.error("Error deleteCustomPrayer:", error);
    throw error;
  }
};

export const updateCustomPrayerCounter = async (payload = {}) => {
  try {
    const { customKey, id: userId, action } = payload; // action: 'increment' or 'decrement'
    const userDocRef = doc(ref, userId);
    
    const incrementValue = action === 'increment' ? 1 : -1;
    
    await updateDoc(userDocRef, {
      [`customPrayers.${customKey}.count`]: increment(incrementValue),
    });
    
    return { success: true, message: "Prayer count updated! 🙏" };
  } catch (error) {
    console.error("Error updateCustomPrayerCounter:", error);
    throw error;
  }
};

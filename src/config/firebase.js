// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBAbFDpXK0QR_FWOb2w_s6aJ5excg-qEZ8",
  authDomain: "nanma-maram.firebaseapp.com",
  projectId: "nanma-maram",
  storageBucket: "nanma-maram.appspot.com",
  messagingSenderId: "611147027871",
  appId: "1:611147027871:web:60dc53927ca18fbfd2d9aa",
  measurementId: "G-NNBE4WKQ52",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const DB = getFirestore(app);

export { DB };

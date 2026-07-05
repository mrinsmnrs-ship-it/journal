// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values are safe to include directly in the code — they are not
// secret. Firebase security is enforced by Firestore Rules (see
// firestore.rules), not by hiding this config. This is why you can
// commit this file straight to a public GitHub repo without worry.
const firebaseConfig = {
  apiKey: "AIzaSyDF55RP1abY-rPiGSftb7g84NF_iqM6dEU",
  authDomain: "apocalypse-archives.firebaseapp.com",
  projectId: "apocalypse-archives",
  storageBucket: "apocalypse-archives.firebasestorage.app",
  messagingSenderId: "532879929499",
  appId: "1:532879929499:web:5060b121cc38cc3402563e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

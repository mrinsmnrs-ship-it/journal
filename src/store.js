// src/store.js
// Baca & simpan data user (trades, theme, dan riwayat chat AI) dalam satu
// dokumen Firestore: users/{uid}. Dipakai oleh App.jsx dan JournalChat.jsx.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function loadUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    return {
      trades: data.trades || [],
      theme: data.theme || "light",
      chatMessages: data.chatMessages || [],
    };
  }
  return { trades: [], theme: "light", chatMessages: [] };
}

export async function saveUserData(uid, partial) {
  await setDoc(doc(db, "users", uid), partial, { merge: true });
}

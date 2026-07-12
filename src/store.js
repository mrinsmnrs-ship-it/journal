// src/store.js
// Baca & simpan data user (trades, theme, dan riwayat chat AI) dalam satu
// dokumen Firestore: users/{uid}. Dipakai oleh App.jsx dan JournalChat.jsx.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Tag options (Symbol / Entry Model) used to be stored as plain string
// arrays. They're now {value, createdAt} objects so the UI can tell how
// old a tag is (its delete button only shows up during its first week).
// Legacy string entries get createdAt: 0, which makes them read as
// "older than a week" automatically — i.e. permanent, since we have no
// real creation date for them.
function normalizeOptions(raw) {
  return (raw || []).map((o) =>
    typeof o === "string" ? { value: o, createdAt: 0 } : o
  );
}

export async function loadUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    return {
      trades: data.trades || [],
      theme: data.theme || "light",
      chatMessages: data.chatMessages || [],
      symbolOptions: normalizeOptions(data.symbolOptions),
      entryModelOptions: normalizeOptions(data.entryModelOptions),
    };
  }
  return { trades: [], theme: "light", chatMessages: [], symbolOptions: [], entryModelOptions: [] };
}

export async function saveUserData(uid, partial) {
  await setDoc(doc(db, "users", uid), partial, { merge: true });
}

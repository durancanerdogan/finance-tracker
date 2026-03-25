// ─── Firebase Setup ───
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (name it anything, e.g. "my-finance-tracker")
// 3. Click "Add app" → Web (</> icon)
// 4. Copy the config values below
// 5. Go to Firestore Database → Create Database → Start in test mode
//
// That's it! Your data will sync across all your devices.

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ⬇️ PASTE YOUR FIREBASE CONFIG HERE ⬇️
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Auto sign-in anonymously (no login needed, but gives each device a unique ID)
let currentUserId = null;
const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      await signInAnonymously(auth);
    } else {
      currentUserId = user.uid;
      resolve(user.uid);
    }
  });
});

// ─── Storage adapter (replaces window.storage) ───
const COLLECTION = "finance-data";
const DOC_KEY = "teacher-fin-v7";

export async function loadAll() {
  try {
    const uid = await authReady;
    const ref = doc(db, COLLECTION, uid + "_" + DOC_KEY);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().value;
    }
    return null;
  } catch (e) {
    console.error("Load error:", e);
    // Fallback to localStorage if Firebase isn't configured yet
    try {
      const local = localStorage.getItem(DOC_KEY);
      return local ? JSON.parse(local) : null;
    } catch { return null; }
  }
}

export async function saveAll(data) {
  // Always save to localStorage as backup
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(data));
  } catch {}

  // Save to Firebase
  try {
    const uid = await authReady;
    const ref = doc(db, COLLECTION, uid + "_" + DOC_KEY);
    await setDoc(ref, { value: data, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Save error (data safe in localStorage):", e);
  }
}

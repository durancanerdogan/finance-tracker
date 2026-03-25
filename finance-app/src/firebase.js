// ─── Firebase Setup (with localStorage fallback) ───
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCuzhnEnt-p2gC7wOAwGtp62fUUaY1ES-k",
  authDomain: "financial-tracker-ac097.firebaseapp.com",
  projectId: "financial-tracker-ac097",
  storageBucket: "financial-tracker-ac097.firebasestorage.app",
  messagingSenderId: "279098830109",
  appId: "1:279098830109:web:21702fa81727c637d405f4",
  measurementId: "G-X38CGTHHML"
};

const DOC_KEY = "teacher-fin-v7";
const COLLECTION = "finance-data";

let db = null;
let userId = null;
let firebaseReady = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  const auth = getAuth(app);

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        await signInAnonymously(auth);
      } else {
        userId = user.uid;
        firebaseReady = true;
        console.log("Firebase connected!");
        try {
          const local = localStorage.getItem(DOC_KEY);
          if (local) {
            const ref = doc(db, COLLECTION, userId + "_" + DOC_KEY);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, { value: JSON.parse(local), updatedAt: new Date().toISOString() });
            }
          }
        } catch (e) { console.log("Sync skipped:", e.message); }
      }
    } catch (e) {
      console.warn("Firebase auth failed, using localStorage only:", e.message);
    }
  });
} catch (e) {
  console.warn("Firebase init failed, using localStorage only:", e.message);
}

export async function loadAll() {
  if (firebaseReady && db && userId) {
    try {
      const ref = doc(db, COLLECTION, userId + "_" + DOC_KEY);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data().value;
      }
    } catch (e) {
      console.warn("Firebase load failed, using localStorage:", e.message);
    }
  }
  try {
    const local = localStorage.getItem(DOC_KEY);
    return local ? JSON.parse(local) : null;
  } catch {
    return null;
  }
}

export async function saveAll(data) {
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(data));
  } catch {}
  if (firebaseReady && db && userId) {
    try {
      const ref = doc(db, COLLECTION, userId + "_" + DOC_KEY);
      await setDoc(ref, { value: data, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn("Firebase save failed (data safe in localStorage):", e.message);
    }
  }
}

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { FIREBASE_CONFIG } from './config.js';

const app = initializeApp(FIREBASE_CONFIG);
const db  = getFirestore(app);

// ── Site password ─────────────────────────────────────────────
export async function getSitePasswordHash() {
  const snap = await getDoc(doc(db, 'config', 'site'));
  return snap.exists() ? snap.data().passwordHash : null;
}

// ── Users ─────────────────────────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUser(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveUser(userId, data) {
  await setDoc(doc(db, 'users', userId), data, { merge: true });
}

// ── Days ──────────────────────────────────────────────────────
export async function getDay(userId, dateStr) {
  const snap = await getDoc(doc(db, 'users', userId, 'days', dateStr));
  return snap.exists() ? snap.data() : { exercise: false, water: false, reading: false, diet: false, sleep: false };
}

export async function saveDay(userId, dateStr, data) {
  await setDoc(doc(db, 'users', userId, 'days', dateStr), data, { merge: true });
}

export async function getAllDays(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'days'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = d.data(); });
  return result;
}

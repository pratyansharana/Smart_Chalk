import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseReady } from '../../lib/firebase';

let localPersistencePromise;

function assertFirebaseAuth() {
  if (!firebaseReady || !auth) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values in .env to enable authentication.');
  }
}

async function ensureLocalPersistence() {
  assertFirebaseAuth();
  if (!localPersistencePromise) {
    localPersistencePromise = setPersistence(auth, browserLocalPersistence).catch((error) => {
      localPersistencePromise = null;
      throw error;
    });
  }
  await localPersistencePromise;
}

export function subscribeToAuthChanges(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function signInWithEmail(email, password) {
  await ensureLocalPersistence();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAuthUser({ email, password, displayName }) {
  await ensureLocalPersistence();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
}

export async function signInWithGooglePopup() {
  await ensureLocalPersistence();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  assertFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

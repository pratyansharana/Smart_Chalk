import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseReady } from '../../lib/firebase';

function assertFirebaseAuth() {
  if (!firebaseReady || !auth) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* values in .env to enable authentication.');
  }
}

export function subscribeToAuthChanges(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function signInWithEmail(email, password) {
  assertFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function createAuthUser({ email, password, displayName }) {
  assertFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
}

export async function signInWithGooglePopup() {
  assertFirebaseAuth();
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

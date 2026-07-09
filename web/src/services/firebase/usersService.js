import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/firestoreCollections';
import { ROLE } from '../../constants/roles';
import { db } from '../../lib/firebase';

export async function getUserProfile(uid) {
  if (!db || !uid) return null;
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snapshot.exists() ? { uid, ...snapshot.data() } : null;
}

export async function createUserProfile(user, role = ROLE.STUDENT, profile = {}) {
  if (!db || !user) return null;
  const payload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email,
    photoURL: user.photoURL || null,
    role,
    createdAt: serverTimestamp(),
    profile: {
      grade: null,
      subjectsOfInterest: [],
      subjectsTaught: [],
      bio: null,
      phone: null,
      ...profile,
    },
    linkedStudentIds: null,
  };
  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), payload, { merge: true });
  return payload;
}

export async function listStudents() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.USERS), where('role', '==', ROLE.STUDENT)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/firestoreCollections';
import { db } from '../../lib/firebase';

export async function listClasses() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.CLASSES), orderBy('startTime', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function subscribeToStudentClasses(studentId, onData, onError) {
  if (!db || !studentId) {
    onData([]);
    return () => {};
  }

  const classesQuery = query(
    collection(db, COLLECTIONS.CLASSES),
    where('studentIds', 'array-contains', studentId),
    orderBy('startTime', 'asc'),
  );

  return onSnapshot(
    classesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function subscribeToTeacherClasses(teacherId, onData, onError) {
  if (!db || !teacherId) {
    onData([]);
    return () => {};
  }

  const classesQuery = query(
    collection(db, COLLECTIONS.CLASSES),
    where('teacherId', '==', teacherId),
    orderBy('startTime', 'asc'),
  );

  return onSnapshot(
    classesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export async function createClassDocument(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTIONS.CLASSES), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function updateClassDocument(classId, updates) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.CLASSES, classId), updates);
}

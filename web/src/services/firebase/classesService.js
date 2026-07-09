import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/firestoreCollections';
import { db } from '../../lib/firebase';

/**
 * Fetches all class batches.
 * @returns {Promise<Array>} List of batches.
 */
export async function listClasses() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.CLASSES), orderBy('startTime', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

/**
 * Subscribes to batches that a student is enrolled in.
 */
export function subscribeToStudentClasses(studentId, onData, onError) {
  if (!db || !studentId) {
    onData([]);
    return () => {};
  }

  const classesQuery = query(
    collection(db, COLLECTIONS.CLASSES),
    where('studentIds', 'array-contains', studentId),
  );

  return onSnapshot(
    classesQuery,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => {
        const tA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
        const tB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
        return tA - tB;
      });
      onData(list);
    },
    onError,
  );
}

/**
 * Subscribes to batches taught by a teacher.
 */
export function subscribeToTeacherClasses(teacherId, onData, onError) {
  if (!db || !teacherId) {
    onData([]);
    return () => {};
  }

  const classesQuery = query(
    collection(db, COLLECTIONS.CLASSES),
    where('teacherId', '==', teacherId),
  );

  return onSnapshot(
    classesQuery,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => {
        const tA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
        const tB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
        return tA - tB;
      });
      onData(list);
    },
    onError,
  );
}

/**
 * Creates a new class batch.
 */
export async function createClassDocument(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTIONS.CLASSES), {
    ...payload,
    pendingStudentIds: [],
    createdAt: serverTimestamp(),
  });
}

/**
 * Updates a class batch.
 */
export async function updateClassDocument(classId, updates) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.CLASSES, classId), updates);
}

/**
 * Fetches a single class batch by ID.
 */
export async function getClassDocument(classId) {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.CLASSES, classId));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

/**
 * Requests to join a class batch.
 */
export async function requestToJoinClass(classId, studentId) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
    pendingStudentIds: arrayUnion(studentId),
  });
}

/**
 * Approves a student's request to join a batch.
 */
export async function approveStudentRequest(classId, studentId) {
  if (!db) return null;
  const classRef = doc(db, COLLECTIONS.CLASSES, classId);
  return runTransaction(db, async (transaction) => {
    const classDoc = await transaction.get(classRef);
    if (!classDoc.exists()) {
      throw new Error('Class Batch does not exist.');
    }
    const data = classDoc.data();
    const currentStudents = data.studentIds || [];
    const currentPending = data.pendingStudentIds || [];

    const nextStudents = currentStudents.includes(studentId) ? currentStudents : [...currentStudents, studentId];
    const nextPending = currentPending.filter((id) => id !== studentId);

    transaction.update(classRef, {
      studentIds: nextStudents,
      pendingStudentIds: nextPending,
    });
  });
}

/**
 * Rejects a student's request to join a batch.
 */
export async function rejectStudentRequest(classId, studentId) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
    pendingStudentIds: arrayRemove(studentId),
  });
}

/**
 * Toggles a batch's live/active state.
 */
export async function toggleBatchLiveStatus(classId, isLive) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.CLASSES, classId), {
    status: isLive ? 'live' : 'scheduled',
  });
}

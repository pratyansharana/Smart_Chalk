import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/firestoreCollections';
import { db } from '../../lib/firebase';

export async function listAssignments() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, COLLECTIONS.ASSIGNMENTS), orderBy('dueDate', 'asc')));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function subscribeToStudentAssignments(studentId, onData, onError) {
  if (!db || !studentId) {
    onData([]);
    return () => {};
  }

  const assignmentsQuery = query(
    collection(db, COLLECTIONS.ASSIGNMENTS),
    where('assignedStudentIds', 'array-contains', studentId),
    orderBy('dueDate', 'asc'),
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function subscribeToTeacherAssignments(teacherId, onData, onError) {
  if (!db || !teacherId) {
    onData([]);
    return () => {};
  }

  const assignmentsQuery = query(
    collection(db, COLLECTIONS.ASSIGNMENTS),
    where('teacherId', '==', teacherId),
    orderBy('dueDate', 'asc'),
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export async function createAssignmentDocument(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTIONS.ASSIGNMENTS), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export async function updateAssignmentDocument(assignmentId, updates) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId), updates);
}

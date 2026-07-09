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
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => {
        const tA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
        const tB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
        return tA - tB;
      });
      onData(list);
    },
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
  );

  return onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => {
        const tA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
        const tB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
        return tA - tB;
      });
      onData(list);
    },
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

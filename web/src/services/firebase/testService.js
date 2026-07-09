import { addDoc, collection, doc, onSnapshot, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const TESTS_COLLECTION = 'tests';
const SUBMISSIONS_COLLECTION = 'test_submissions';

/**
 * Creates a new test.
 */
export async function createTestDocument(payload) {
  if (!db) return null;
  return addDoc(collection(db, TESTS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribes to tests published for a specific batch.
 */
export function subscribeToBatchTests(classId, onData, onError) {
  if (!db || !classId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, TESTS_COLLECTION), where('classId', '==', classId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tB - tA;
      });
      onData(list);
    },
    onError
  );
}

/**
 * Submits a test solution.
 */
export async function submitTestSolution(payload) {
  if (!db) return null;
  return addDoc(collection(db, SUBMISSIONS_COLLECTION), {
    ...payload,
    status: 'submitted',
    submittedAt: serverTimestamp(),
  });
}

/**
 * Grades a test solution.
 */
export async function gradeTestSubmission(submissionId, gradeData) {
  if (!db) return null;
  return updateDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId), {
    ...gradeData,
    status: 'graded',
    gradedAt: serverTimestamp(),
  });
}

/**
 * Subscribes to all test submissions for a specific class batch (for teachers).
 */
export function subscribeToBatchTestSubmissions(classId, onData, onError) {
  if (!db || !classId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('classId', '==', classId));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
}

/**
 * Subscribes to test submissions for a student (to view results).
 */
export function subscribeToStudentTestSubmissions(studentId, onData, onError) {
  if (!db || !studentId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('studentId', '==', studentId));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
}

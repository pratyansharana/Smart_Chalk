import { addDoc, collection, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const QUIZZES_COLLECTION = 'quizzes';
const SUBMISSIONS_COLLECTION = 'quiz_submissions';

/**
 * Creates a new quiz.
 */
export async function createQuizDocument(payload) {
  if (!db) return null;
  return addDoc(collection(db, QUIZZES_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribes to quizzes created for a specific class batch.
 */
export function subscribeToBatchQuizzes(classId, onData, onError) {
  if (!db || !classId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, QUIZZES_COLLECTION), where('classId', '==', classId));

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
 * Submits a student's quiz scorecard.
 */
export async function submitQuizScorecard(payload) {
  if (!db) return null;
  return addDoc(collection(db, SUBMISSIONS_COLLECTION), {
    ...payload,
    submittedAt: serverTimestamp(),
  });
}

/**
 * Subscribes to submissions for a specific quiz (for the Leaderboard).
 */
export function subscribeToQuizScores(quizId, onData, onError) {
  if (!db || !quizId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, SUBMISSIONS_COLLECTION), where('quizId', '==', quizId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      // Sort locally by score desc, then by submittedAt asc (first to get the score wins tie-break)
      list.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        const tA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
        const tB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
        return tA - tB;
      });
      onData(list);
    },
    onError
  );
}

import { addDoc, collection, doc, updateDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const COLLECTION_NAME = 'self_study_worksheets';

/**
 * Creates a new self-study worksheet.
 */
export async function createSelfStudyWorksheet(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTION_NAME), {
    ...payload,
    status: 'created',
    createdAt: serverTimestamp(),
  });
}

/**
 * Updates a self-study worksheet (e.g. submitting answers or adding grading results).
 */
export async function updateSelfStudyWorksheet(worksheetId, payload) {
  if (!db) return null;
  const ref = doc(db, COLLECTION_NAME, worksheetId);
  return updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

/**
 * Subscribes to self-study worksheets for a specific student and batch class.
 */
export function subscribeToStudentWorksheets(studentId, classId, onData, onError) {
  if (!db || !studentId || !classId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where('studentId', '==', studentId),
    where('classId', '==', classId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort locally by createdAt desc
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

import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/firestoreCollections';
import { db } from '../../lib/firebase';

export async function createSubmissionDocument(payload) {
  if (!db) return null;
  const id = `${payload.assignmentId}_${payload.studentId}`;
  const submissionRef = doc(db, COLLECTIONS.SUBMISSIONS, id);
  await setDoc(submissionRef, {
    id,
    ...payload,
    status: payload.status || 'submitted',
    submittedAt: serverTimestamp(),
  }, { merge: true });
  return submissionRef;
}

export function subscribeToStudentSubmissions(studentId, onData, onError) {
  if (!db || !studentId) {
    onData([]);
    return () => {};
  }

  const submissionsQuery = query(collection(db, COLLECTIONS.SUBMISSIONS), where('studentId', '==', studentId));
  return onSnapshot(
    submissionsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export function subscribeToSubmissionsForAssignments(assignmentIds, onData, onError) {
  if (!db || !assignmentIds?.length) {
    onData([]);
    return () => {};
  }

  const submissionsQuery = query(collection(db, COLLECTIONS.SUBMISSIONS), where('assignmentId', 'in', assignmentIds.slice(0, 10)));
  return onSnapshot(
    submissionsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export async function gradeSubmissionDocument(submissionId, { grade, feedback, gradedBy }) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.SUBMISSIONS, submissionId), {
    grade: Number(grade),
    feedback,
    gradedBy,
    status: 'graded',
    gradedAt: serverTimestamp(),
  });
}

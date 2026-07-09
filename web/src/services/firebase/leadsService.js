import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/firestoreCollections';
import { db } from '../../lib/firebase';

export async function createLeadDocument(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTIONS.LEADS), {
    ...payload,
    status: 'new',
    assignedTeacherId: null,
    notes: [],
    createdAt: serverTimestamp(),
  });
}

export function subscribeToLeads(onData, onError, status = '') {
  if (!db) {
    onData([]);
    return () => {};
  }

  const base = collection(db, COLLECTIONS.LEADS);
  const leadsQuery = status
    ? query(base, where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(base, orderBy('createdAt', 'desc'));

  return onSnapshot(
    leadsQuery,
    (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
}

export async function updateLeadDocument(leadId, updates) {
  if (!db) return null;
  return updateDoc(doc(db, COLLECTIONS.LEADS, leadId), updates);
}

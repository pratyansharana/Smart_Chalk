import { addDoc, collection, doc, deleteDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const COLLECTION_NAME = 'vault_items';

/**
 * Creates a new vault item document.
 */
export async function addVaultItem(payload) {
  if (!db) return null;
  return addDoc(collection(db, COLLECTION_NAME), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

/**
 * Deletes a vault item by ID.
 */
export async function deleteVaultItem(itemId) {
  if (!db) return null;
  return deleteDoc(doc(db, COLLECTION_NAME, itemId));
}

/**
 * Subscribes to vault items for a specific class batch.
 */
export function subscribeToBatchVaultItems(classId, onData, onError) {
  if (!db || !classId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where('classId', '==', classId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
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

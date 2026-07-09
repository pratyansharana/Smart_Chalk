import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants/firestoreCollections';

/**
 * Subscribes to a single class batch by ID.
 * @param {string | null | undefined} batchId The Firestore doc ID of the batch.
 * @returns {{data: Object|null, loading: boolean, error: Error|null}} Real-time batch state.
 */
export function useBatchDetails(batchId) {
  const [state, setState] = useState({ data: null, loading: Boolean(batchId), error: null });

  useEffect(() => {
    if (!batchId || !db) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    const ref = doc(db, COLLECTIONS.CLASSES, batchId);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setState({ data: { id: snap.id, ...snap.data() }, loading: false, error: null });
        } else {
          setState({ data: null, loading: false, error: new Error('Batch not found.') });
        }
      },
      (error) => setState({ data: null, loading: false, error }),
    );
  }, [batchId]);

  return state;
}

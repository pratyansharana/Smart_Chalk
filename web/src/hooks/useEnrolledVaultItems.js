import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useEnrolledVaultItems(batchIds) {
  const [state, setState] = useState({ data: [], loading: batchIds.length > 0, error: null });

  useEffect(() => {
    if (!batchIds.length || !db) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    const q = query(collection(db, 'vault_items'), where('classId', 'in', batchIds));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        list.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return tB - tA;
        });
        setState({ data: list, loading: false, error: null });
      },
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [batchIds.join('|')]);

  return state;
}

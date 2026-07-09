import { useEffect, useState } from 'react';
import { subscribeToBatchTestSubmissions } from '../services/firebase/testService';

export function useBatchTestSubmissions(batchId) {
  const [state, setState] = useState({ data: [], loading: Boolean(batchId), error: null });

  useEffect(() => {
    if (!batchId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToBatchTestSubmissions(
      batchId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [batchId]);

  return state;
}

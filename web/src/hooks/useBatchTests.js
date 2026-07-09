import { useEffect, useState } from 'react';
import { subscribeToBatchTests } from '../services/firebase/testService';

export function useBatchTests(batchId) {
  const [state, setState] = useState({ data: [], loading: Boolean(batchId), error: null });

  useEffect(() => {
    if (!batchId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToBatchTests(
      batchId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [batchId]);

  return state;
}

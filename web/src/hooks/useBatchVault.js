import { useEffect, useState } from 'react';
import { subscribeToBatchVaultItems } from '../services/firebase/vaultService';

export function useBatchVault(batchId) {
  const [state, setState] = useState({ data: [], loading: Boolean(batchId), error: null });

  useEffect(() => {
    if (!batchId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToBatchVaultItems(
      batchId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [batchId]);

  return state;
}

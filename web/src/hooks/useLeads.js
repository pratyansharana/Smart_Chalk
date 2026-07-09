import { useEffect, useState } from 'react';
import { subscribeToLeads } from '../services/firebase/leadsService';

/**
 * Subscribes to public enquiry leads for teacher review.
 * @param {string} status Optional status filter.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Real-time lead state.
 * @sideEffects Opens a Firestore onSnapshot listener.
 */
export function useLeads(status = '') {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToLeads(
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
      status,
    );
  }, [status]);

  return state;
}

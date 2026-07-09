import { useEffect, useState } from 'react';
import { subscribeToStudentSubmissions } from '../services/firebase/submissionsService';

/**
 * Subscribes to all submissions owned by a student.
 * @param {string | null | undefined} studentId Current Firebase user id.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Real-time submission subscription state.
 * @sideEffects Opens a Firestore onSnapshot listener while studentId is present.
 */
export function useSubmissions(studentId) {
  const [state, setState] = useState({ data: [], loading: Boolean(studentId), error: null });

  useEffect(() => {
    if (!studentId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToStudentSubmissions(
      studentId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [studentId]);

  return state;
}

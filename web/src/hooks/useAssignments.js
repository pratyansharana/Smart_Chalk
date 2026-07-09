import { useEffect, useState } from 'react';
import { subscribeToStudentAssignments } from '../services/firebase/assignmentsService';

/**
 * Subscribes to assignments assigned to a student.
 * @param {string | null | undefined} studentId Current Firebase user id.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Real-time assignment subscription state.
 * @sideEffects Opens a Firestore onSnapshot listener while studentId is present.
 */
export function useAssignments(studentId) {
  const [state, setState] = useState({ data: [], loading: Boolean(studentId), error: null });

  useEffect(() => {
    if (!studentId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToStudentAssignments(
      studentId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [studentId]);

  return state;
}

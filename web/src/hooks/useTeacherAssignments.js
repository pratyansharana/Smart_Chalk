import { useEffect, useState } from 'react';
import { subscribeToTeacherAssignments } from '../services/firebase/assignmentsService';

/**
 * Subscribes to assignments owned by a teacher.
 * @param {string | null | undefined} teacherId Current teacher uid.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Real-time assignment state.
 * @sideEffects Opens a Firestore onSnapshot listener while teacherId exists.
 */
export function useTeacherAssignments(teacherId) {
  const [state, setState] = useState({ data: [], loading: Boolean(teacherId), error: null });

  useEffect(() => {
    if (!teacherId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToTeacherAssignments(
      teacherId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [teacherId]);

  return state;
}

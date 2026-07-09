import { useEffect, useState } from 'react';
import { subscribeToTeacherClasses } from '../services/firebase/classesService';

/**
 * Subscribes to classes owned by a teacher.
 * @param {string | null | undefined} teacherId Current teacher uid.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Real-time class state.
 * @sideEffects Opens a Firestore onSnapshot listener while teacherId exists.
 */
export function useTeacherClasses(teacherId) {
  const [state, setState] = useState({ data: [], loading: Boolean(teacherId), error: null });

  useEffect(() => {
    if (!teacherId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToTeacherClasses(
      teacherId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [teacherId]);

  return state;
}

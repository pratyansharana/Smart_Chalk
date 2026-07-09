import { useEffect, useMemo, useState } from 'react';
import { subscribeToSubmissionsForAssignments } from '../services/firebase/submissionsService';

/**
 * Subscribes to submissions for a teacher's assignments.
 * @param {Array} assignments Teacher assignment documents.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Real-time submission state.
 * @sideEffects Opens a Firestore onSnapshot listener for up to 10 assignment ids.
 */
export function useTeacherSubmissions(assignments) {
  const assignmentIds = useMemo(() => assignments.map((assignment) => assignment.id).filter(Boolean), [assignments]);
  const [state, setState] = useState({ data: [], loading: assignmentIds.length > 0, error: null });

  useEffect(() => {
    if (!assignmentIds.length) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToSubmissionsForAssignments(
      assignmentIds,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [assignmentIds.join('|')]);

  return state;
}

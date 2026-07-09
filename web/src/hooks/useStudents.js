import { useEffect, useState } from 'react';
import { listStudents } from '../services/firebase/usersService';

/**
 * Loads student users for teacher selection controls.
 * @returns {{data: Array, loading: boolean, error: Error|null}} Student list request state.
 * @sideEffects Performs a Firestore query for role=student.
 */
export function useStudents() {
  const [state, setState] = useState({ data: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    listStudents()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: [], loading: false, error }));

    return () => {
      active = false;
    };
  }, []);

  return state;
}

import { useEffect, useState } from 'react';
import { subscribeToStudentTestSubmissions } from '../services/firebase/testService';

export function useStudentTestSubmissions(studentId) {
  const [state, setState] = useState({ data: [], loading: Boolean(studentId), error: null });

  useEffect(() => {
    if (!studentId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToStudentTestSubmissions(
      studentId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [studentId]);

  return state;
}

import { useEffect, useState } from 'react';
import { subscribeToQuizScores } from '../services/firebase/quizService';

export function useQuizScores(quizId) {
  const [state, setState] = useState({ data: [], loading: Boolean(quizId), error: null });

  useEffect(() => {
    if (!quizId) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return subscribeToQuizScores(
      quizId,
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [quizId]);

  return state;
}

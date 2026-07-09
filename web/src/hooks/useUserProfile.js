import { useEffect, useState } from 'react';
import { getUserProfile } from '../services/firebase/usersService';

/**
 * Loads a single user profile from Firestore.
 * @param {string | null | undefined} uid Firebase Auth UID to read.
 * @returns {{data: object|null, loading: boolean, error: Error|null}} Profile request state.
 * @sideEffects Performs a Firestore document read when uid changes.
 */
export function useUserProfile(uid) {
  const [state, setState] = useState({ data: null, loading: Boolean(uid), error: null });

  useEffect(() => {
    let active = true;
    if (!uid) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    getUserProfile(uid)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));

    return () => {
      active = false;
    };
  }, [uid]);

  return state;
}

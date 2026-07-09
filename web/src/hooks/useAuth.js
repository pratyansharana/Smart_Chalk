import { useCallback } from 'react';
import { ROLE } from '../constants/roles';
import { createAuthUser, signInWithEmail, signInWithGooglePopup, signOutUser } from '../services/firebase/authService';
import { createUserProfile, getUserProfile } from '../services/firebase/usersService';
import { useAuthStore } from '../store/useAuthStore';

/**
 * React-facing auth API backed by Firebase services and the Zustand auth store.
 * @returns Current auth state plus login, signup, and logout actions.
 * @sideEffects Creates Firebase Auth users and Firestore user profiles during signup.
 */
export function useAuth() {
  const state = useAuthStore();

  const login = useCallback(async (email, password) => {
    const result = await signInWithEmail(email, password);
    return result.user;
  }, []);

  const signup = useCallback(async ({ email, password, displayName, role = ROLE.STUDENT }) => {
    const user = await createAuthUser({ email, password, displayName });
    await createUserProfile(user, role);
    return user;
  }, []);

  const loginWithGoogle = useCallback(async (role = ROLE.STUDENT) => {
    const user = await signInWithGooglePopup();
    const existingProfile = await getUserProfile(user.uid);
    if (!existingProfile) {
      const profile = await createUserProfile(user, role);
      useAuthStore.setState({ profile, role });
      return { user, role };
    }
    useAuthStore.setState({ profile: existingProfile, role: existingProfile.role });
    return { user, role: existingProfile.role };
  }, []);

  const checkGoogleUserProfile = useCallback(async () => {
    const user = await signInWithGooglePopup();
    const existingProfile = await getUserProfile(user.uid);
    return { user, existingProfile };
  }, []);

  const completeGoogleSignup = useCallback(async (user, role) => {
    const profile = await createUserProfile(user, role);
    useAuthStore.setState({ profile, role });
    return role;
  }, []);

  const logout = useCallback(() => signOutUser(), []);

  return { 
    ...state, 
    login, 
    signup, 
    loginWithGoogle, 
    checkGoogleUserProfile, 
    completeGoogleSignup, 
    logout 
  };
}

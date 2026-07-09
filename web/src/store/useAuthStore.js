import { create } from 'zustand';
import { firebaseReady } from '../lib/firebase';
import { subscribeToAuthChanges } from '../services/firebase/authService';
import { getUserProfile } from '../services/firebase/usersService';

export const useAuthStore = create((set, get) => ({
  currentUser: null,
  role: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  unsubscribe: null,
  initializeAuthListener: () => {
    if (get().unsubscribe) return get().unsubscribe;
    if (!firebaseReady) {
      set({ currentUser: null, role: null, profile: null, isLoading: false, isInitialized: true, error: null });
      return null;
    }

    set({ isLoading: true });
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      try {
        if (!user) {
          set({ currentUser: null, role: null, profile: null, isLoading: false, isInitialized: true, error: null });
          return;
        }

        const profile = await getUserProfile(user.uid);
        set({
          currentUser: user,
          profile,
          role: profile?.role || null,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
      } catch (error) {
        set({ currentUser: user || null, role: null, profile: null, isLoading: false, isInitialized: true, error });
      }
    });
    set({ unsubscribe });
    return unsubscribe;
  },
}));

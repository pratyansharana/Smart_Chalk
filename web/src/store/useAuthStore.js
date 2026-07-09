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

        let profile = await getUserProfile(user.uid);

        // If profile is not found immediately (signup race condition), retry a few times
        if (!profile) {
          for (let i = 0; i < 6; i++) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            profile = await getUserProfile(user.uid);
            if (profile) break;
          }
        }

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

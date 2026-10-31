import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      toast: null,
      sidebarCollapsed: false,
      theme: 'current',
      setToast: (toast) => set({ toast }),
      clearToast: () => set({ toast: null }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      cycleTheme: () => set((state) => ({
        theme: state.theme === 'current' ? 'glass' : state.theme === 'glass' ? 'light' : 'current',
      })),
    }),
    {
      name: 'smartchalk-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

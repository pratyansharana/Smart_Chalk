import { create } from 'zustand';

export const useUIStore = create((set) => ({
  toast: null,
  sidebarCollapsed: false,
  setToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

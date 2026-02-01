/**
 * Navigation Store
 *
 * Simple client-side routing for the desktop app.
 * No need for URL-based routing in Electron.
 */

import { create } from 'zustand';

export type Page = 'dashboard' | 'calendar' | 'workouts' | 'running' | 'weight' | 'volume' | 'goals' | 'achievements' | 'workout-library' | 'settings';

interface NavigationState {
  currentPage: Page;
  sidebarCollapsed: boolean;
  navigate: (page: Page) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  navigate: (page: Page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
}));

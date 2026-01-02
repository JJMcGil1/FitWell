/**
 * Navigation Store
 *
 * Simple client-side routing for the desktop app.
 * No need for URL-based routing in Electron.
 */

import { create } from 'zustand';

export type Page = 'calendar' | 'workouts' | 'running' | 'goals' | 'settings';

interface NavigationState {
  currentPage: Page;
  sidebarCollapsed: boolean;
  navigate: (page: Page) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'calendar',
  sidebarCollapsed: false,
  navigate: (page: Page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
}));

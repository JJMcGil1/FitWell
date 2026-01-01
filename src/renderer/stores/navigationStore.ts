/**
 * Navigation Store
 *
 * Simple client-side routing for the desktop app.
 * No need for URL-based routing in Electron.
 */

import { create } from 'zustand';

export type Page = 'home' | 'calendar' | 'goals';

interface NavigationState {
  currentPage: Page;
  sidebarCollapsed: boolean;
  navigate: (page: Page) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'home',
  sidebarCollapsed: false,
  navigate: (page: Page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
}));

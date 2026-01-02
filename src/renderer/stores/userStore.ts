/**
 * User Store
 *
 * Manages the current user state and user switching.
 * This is the primary state for the entire app - everything filters by user.
 */

import { create } from 'zustand';
import type { User, AppSettings } from '../../shared/types';

interface UserState {
  // Data
  users: User[];
  currentUser: User | null;
  settings: AppSettings | null;

  // Loading states
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  createUser: (name: string, avatarColor: string) => Promise<User>;
  updateUser: (id: string, updates: Partial<Pick<User, 'name' | 'avatarColor'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  settings: null,
  isLoading: true,
  isSwitching: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      const [users, settings] = await Promise.all([
        window.api.getUsers(),
        window.api.getSettings(),
      ]);

      // Find the last active user, or default to first user
      let currentUser: User | null = null;
      if (settings.lastActiveUserId) {
        currentUser = users.find((u) => u.id === settings.lastActiveUserId) || null;
      }
      if (!currentUser && users.length > 0) {
        currentUser = users[0];
        // Update settings to remember this user
        await window.api.updateSettings({ lastActiveUserId: currentUser.id });
      }

      set({ users, currentUser, settings, isLoading: false });
    } catch (error) {
      console.error('[UserStore] Init failed:', error);
      set({ error: 'Failed to initialize app', isLoading: false });
    }
  },

  switchUser: async (userId: string) => {
    const { users, currentUser } = get();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      console.error('[UserStore] User not found:', userId);
      return;
    }

    // Skip if same user
    if (currentUser?.id === userId) return;

    // Start exit animation
    set({ isSwitching: true });

    // Wait for exit animation
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Switch the user
    set({ currentUser: user });

    // Persist the selection
    await window.api.updateSettings({ lastActiveUserId: userId });

    // Wait for enter animation to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // End transition
    set({ isSwitching: false });
  },

  createUser: async (name: string, avatarColor: string) => {
    const newUser = await window.api.createUser(name, avatarColor);
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  updateUser: async (id: string, updates) => {
    const updatedUser = await window.api.updateUser(id, updates);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? updatedUser : u)),
      currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
    }));
  },

  deleteUser: async (id: string) => {
    const { users, currentUser } = get();

    // Don't allow deleting if only one user
    if (users.length <= 1) {
      throw new Error('Cannot delete the last user');
    }

    await window.api.deleteUser(id);

    const remainingUsers = users.filter((u) => u.id !== id);
    const newCurrentUser =
      currentUser?.id === id ? remainingUsers[0] : currentUser;

    set({
      users: remainingUsers,
      currentUser: newCurrentUser,
    });

    // Update settings if current user changed
    if (currentUser?.id === id && newCurrentUser) {
      await window.api.updateSettings({ lastActiveUserId: newCurrentUser.id });
    }
  },

  updateSettings: async (updates) => {
    const newSettings = await window.api.updateSettings(updates);
    set({ settings: newSettings });
  },
}));

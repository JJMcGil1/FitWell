/**
 * Weight Store
 *
 * Manages weight entries for tracking and graphing.
 */

import { create } from 'zustand';
import type { WeightEntry } from '../../shared/types';

interface WeightState {
  entries: WeightEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEntries: (userId: string) => Promise<void>;
  addEntry: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) => Promise<WeightEntry>;
  deleteEntry: (id: string) => Promise<void>;

  // Computed
  getLatestWeight: () => WeightEntry | null;
  getWeightChange: (days: number) => number | null;

  // Reset
  reset: () => void;
}

export const useWeightStore = create<WeightState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchEntries: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const entries = await window.api.getWeightEntries(userId);
      // Sort by date descending (most recent first)
      entries.sort((a, b) => b.date.localeCompare(a.date));
      set({ entries, isLoading: false });
    } catch (error) {
      console.error('[WeightStore] Failed to fetch entries:', error);
      set({ error: 'Failed to load weight data', isLoading: false });
    }
  },

  addEntry: async (entry) => {
    const newEntry = await window.api.addWeightEntry(entry);

    set((state) => {
      // Insert maintaining sort order
      const newEntries = [...state.entries, newEntry];
      newEntries.sort((a, b) => b.date.localeCompare(a.date));
      return { entries: newEntries };
    });

    return newEntry;
  },

  deleteEntry: async (id: string) => {
    await window.api.deleteWeightEntry(id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },

  getLatestWeight: () => {
    const { entries } = get();
    return entries.length > 0 ? entries[0] : null;
  },

  getWeightChange: (days: number) => {
    const { entries } = get();
    if (entries.length < 2) return null;

    const latest = entries[0];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    // Find the entry closest to the cutoff date
    const oldEntry = entries.find((e) => e.date <= cutoffStr);
    if (!oldEntry) return null;

    return latest.weight - oldEntry.weight;
  },

  reset: () => {
    set({ entries: [], isLoading: false, error: null });
  },
}));

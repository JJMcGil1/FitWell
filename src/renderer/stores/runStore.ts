/**
 * Run Store
 *
 * Manages running data for the current user.
 * Handles CRUD operations, statistics, and filtering.
 */

import { create } from 'zustand';
import type { Run, RunType } from '../../shared/types';

interface RunState {
  // Data
  runs: Run[];
  selectedRun: Run | null;

  // View state
  isLoading: boolean;
  error: string | null;
  filterType: RunType | 'all';

  // Actions
  fetchRuns: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
  createRun: (run: Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>) => Promise<Run>;
  updateRun: (id: string, updates: Partial<Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  setSelectedRun: (run: Run | null) => void;
  setFilterType: (type: RunType | 'all') => void;

  // Computed
  getFilteredRuns: () => Run[];
  getRunsByDate: (date: string) => Run[];
  getRunStats: () => RunStats;

  // Reset
  reset: () => void;
}

interface RunStats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  averagePace: number;
  thisWeekRuns: number;
  thisWeekDistance: number;
  thisMonthRuns: number;
  thisMonthDistance: number;
  longestRun: number;
  fastestPace: number;
  byType: Record<RunType, number>;
}

const initialState = {
  runs: [],
  selectedRun: null,
  isLoading: false,
  error: null,
  filterType: 'all' as RunType | 'all',
};

export const useRunStore = create<RunState>((set, get) => ({
  ...initialState,

  fetchRuns: async (userId: string, startDate?: string, endDate?: string) => {
    try {
      set({ isLoading: true, error: null });
      const runs = await window.api.getRuns(userId, startDate, endDate);
      set({ runs, isLoading: false });
    } catch (error) {
      console.error('[RunStore] Failed to fetch runs:', error);
      set({ error: 'Failed to load runs', isLoading: false });
    }
  },

  createRun: async (run) => {
    try {
      const newRun = await window.api.createRun(run);
      set((state) => ({
        runs: [newRun, ...state.runs],
      }));
      return newRun;
    } catch (error) {
      console.error('[RunStore] Failed to create run:', error);
      throw error;
    }
  },

  updateRun: async (id, updates) => {
    try {
      const updatedRun = await window.api.updateRun(id, updates);
      set((state) => ({
        runs: state.runs.map((r) => (r.id === id ? updatedRun : r)),
        selectedRun: state.selectedRun?.id === id ? updatedRun : state.selectedRun,
      }));
    } catch (error) {
      console.error('[RunStore] Failed to update run:', error);
      throw error;
    }
  },

  deleteRun: async (id) => {
    try {
      await window.api.deleteRun(id);
      set((state) => ({
        runs: state.runs.filter((r) => r.id !== id),
        selectedRun: state.selectedRun?.id === id ? null : state.selectedRun,
      }));
    } catch (error) {
      console.error('[RunStore] Failed to delete run:', error);
      throw error;
    }
  },

  setSelectedRun: (run) => {
    set({ selectedRun: run });
  },

  setFilterType: (type) => {
    set({ filterType: type });
  },

  getFilteredRuns: () => {
    const { runs, filterType } = get();
    if (filterType === 'all') return runs;
    return runs.filter((r) => r.type === filterType);
  },

  getRunsByDate: (date: string) => {
    return get().runs.filter((r) => r.date === date);
  },

  getRunStats: () => {
    const { runs } = get();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeekRuns = runs.filter((r) => new Date(r.date) >= startOfWeek);
    const thisMonthRuns = runs.filter((r) => new Date(r.date) >= startOfMonth);

    const totalDistance = runs.reduce((sum, r) => sum + r.distance, 0);
    const totalDuration = runs.reduce((sum, r) => sum + r.duration, 0);

    const runsWithPace = runs.filter((r) => r.pace && r.pace > 0);
    const averagePace = runsWithPace.length > 0
      ? runsWithPace.reduce((sum, r) => sum + (r.pace || 0), 0) / runsWithPace.length
      : 0;

    const fastestPace = runsWithPace.length > 0
      ? Math.min(...runsWithPace.map((r) => r.pace || Infinity))
      : 0;

    const longestRun = runs.length > 0
      ? Math.max(...runs.map((r) => r.distance))
      : 0;

    const byType: Record<RunType, number> = {
      easy: 0,
      tempo: 0,
      interval: 0,
      long: 0,
      recovery: 0,
      race: 0,
    };

    for (const run of runs) {
      byType[run.type]++;
    }

    return {
      totalRuns: runs.length,
      totalDistance,
      totalDuration,
      averagePace,
      thisWeekRuns: thisWeekRuns.length,
      thisWeekDistance: thisWeekRuns.reduce((sum, r) => sum + r.distance, 0),
      thisMonthRuns: thisMonthRuns.length,
      thisMonthDistance: thisMonthRuns.reduce((sum, r) => sum + r.distance, 0),
      longestRun,
      fastestPace,
      byType,
    };
  },

  reset: () => {
    set(initialState);
  },
}));

// Utility function to format pace (minutes per mile) to mm:ss string
export const formatPace = (pace: number | undefined): string => {
  if (!pace || pace <= 0) return '--:--';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Utility function to format duration (minutes) to h:mm:ss or mm:ss
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes - Math.floor(minutes)) * 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

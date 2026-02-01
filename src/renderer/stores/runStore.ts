/**
 * Run Store (Cardio Store)
 *
 * Manages cardio session data for the current user.
 * Handles CRUD operations, statistics, and filtering by cardio type.
 */

import { create } from 'zustand';
import type { Run, CardioType, DistanceUnit } from '../../shared/types';

/**
 * Convert a distance value from any supported unit to miles.
 * Units without a meaningful mile conversion (laps, floors, steps) are excluded
 * from distance totals — they return 0.
 */
export const toMiles = (distance: number, unit: DistanceUnit = 'miles'): number => {
  switch (unit) {
    case 'miles':
      return distance;
    case 'km':
      return distance * 0.621371;
    case 'meters':
      return distance * 0.000621371;
    case 'yards':
      return distance * 0.000568182;
    // laps / floors / steps have no standard mile equivalent — exclude from totals
    case 'laps':
    case 'floors':
    case 'steps':
    default:
      return 0;
  }
};

interface RunState {
  // Data
  runs: Run[];
  selectedRun: Run | null;

  // View state
  isLoading: boolean;
  error: string | null;
  filterCardioType: CardioType | 'all';

  // Actions
  fetchRuns: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
  createRun: (run: Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>) => Promise<Run>;
  updateRun: (id: string, updates: Partial<Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  setSelectedRun: (run: Run | null) => void;
  setFilterCardioType: (type: CardioType | 'all') => void;

  // Legacy compatibility
  filterType: string;
  setFilterType: (type: string) => void;

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
  totalCalories: number;
  averagePace: number;
  thisWeekRuns: number;
  thisWeekDistance: number;
  thisWeekDuration: number;
  thisMonthRuns: number;
  thisMonthDistance: number;
  thisMonthDuration: number;
  thisMonthCalories: number;
  longestRun: number;
  fastestPace: number;
}

const initialState = {
  runs: [],
  selectedRun: null,
  isLoading: false,
  error: null,
  filterCardioType: 'all' as CardioType | 'all',
  filterType: 'all',
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

  setFilterCardioType: (type) => {
    set({ filterCardioType: type });
  },

  // Legacy compatibility
  setFilterType: (type) => {
    set({ filterType: type });
  },

  getFilteredRuns: () => {
    const { runs, filterCardioType } = get();
    if (filterCardioType === 'all') return runs;
    return runs.filter((r) => (r.cardioType || 'running') === filterCardioType);
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

    const distanceInMiles = (r: Run) => toMiles(r.distance, r.distanceUnit || 'miles');

    const totalDistance = runs.reduce((sum, r) => sum + distanceInMiles(r), 0);
    const totalDuration = runs.reduce((sum, r) => sum + r.duration, 0);
    const totalCalories = runs.reduce((sum, r) => sum + (r.calories || 0), 0);

    const runsWithPace = runs.filter((r) => r.pace && r.pace > 0);
    const averagePace = runsWithPace.length > 0
      ? runsWithPace.reduce((sum, r) => sum + (r.pace || 0), 0) / runsWithPace.length
      : 0;

    const fastestPace = runsWithPace.length > 0
      ? Math.min(...runsWithPace.map((r) => r.pace || Infinity))
      : 0;

    const longestRun = runs.length > 0
      ? Math.max(...runs.map((r) => distanceInMiles(r)))
      : 0;

    return {
      totalRuns: runs.length,
      totalDistance,
      totalDuration,
      totalCalories,
      averagePace,
      thisWeekRuns: thisWeekRuns.length,
      thisWeekDistance: thisWeekRuns.reduce((sum, r) => sum + distanceInMiles(r), 0),
      thisWeekDuration: thisWeekRuns.reduce((sum, r) => sum + r.duration, 0),
      thisMonthRuns: thisMonthRuns.length,
      thisMonthDistance: thisMonthRuns.reduce((sum, r) => sum + distanceInMiles(r), 0),
      thisMonthDuration: thisMonthRuns.reduce((sum, r) => sum + r.duration, 0),
      thisMonthCalories: thisMonthRuns.reduce((sum, r) => sum + (r.calories || 0), 0),
      longestRun,
      fastestPace,
    };
  },

  reset: () => {
    set(initialState);
  },
}));

// Utility function to format pace (minutes per unit) to mm:ss string
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

// Utility to format total duration — scales to min / hr / days
export const formatTotalDuration = (minutes: number): string => {
  const totalHours = minutes / 60;
  const totalDays = totalHours / 24;

  if (totalDays >= 1) {
    const days = Math.floor(totalDays);
    const remainingHrs = Math.round(totalHours - days * 24);
    return remainingHrs > 0 ? `${days}d ${remainingHrs}hr` : `${days}d`;
  }
  if (totalHours >= 1) {
    const hrs = Math.floor(totalHours);
    const remainingMins = Math.round(minutes - hrs * 60);
    return remainingMins > 0 ? `${hrs}hr ${remainingMins}min` : `${hrs}hr`;
  }
  return `${Math.round(minutes)}min`;
};

// Utility to split duration into { value, unit } for stat card display
export const splitDuration = (minutes: number): { value: string; unit: string } => {
  const totalHours = minutes / 60;
  const totalDays = totalHours / 24;

  if (totalDays >= 1) {
    const rounded = totalDays % 1 === 0 ? totalDays.toString() : totalDays.toFixed(1);
    return { value: rounded, unit: totalDays === 1 ? 'day' : 'days' };
  }
  if (totalHours >= 1) {
    const rounded = totalHours % 1 === 0 ? totalHours.toString() : totalHours.toFixed(1);
    return { value: rounded, unit: 'hr' };
  }
  return { value: Math.round(minutes).toString(), unit: 'min' };
};

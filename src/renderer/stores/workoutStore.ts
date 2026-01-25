/**
 * Workout Store
 *
 * Manages workout data for the current user.
 * Handles CRUD operations and filtering.
 */

import { create } from 'zustand';
import type { Workout, WorkoutType, Exercise, ExerciseSet } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutState {
  // Data
  workouts: Workout[];
  selectedWorkout: Workout | null;

  // View state
  isLoading: boolean;
  error: string | null;
  filterType: WorkoutType | 'all';

  // Actions
  fetchWorkouts: (userId: string, startDate?: string, endDate?: string) => Promise<void>;
  createWorkout: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workout>;
  updateWorkout: (id: string, updates: Partial<Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  setSelectedWorkout: (workout: Workout | null) => void;
  setFilterType: (type: WorkoutType | 'all') => void;

  // Computed
  getFilteredWorkouts: () => Workout[];
  getWorkoutsByDate: (date: string) => Workout[];
  getWorkoutStats: () => { total: number; thisWeek: number; thisMonth: number; byType: Record<WorkoutType, number> };

  // Reset
  reset: () => void;
}

const initialState = {
  workouts: [],
  selectedWorkout: null,
  isLoading: false,
  error: null,
  filterType: 'all' as WorkoutType | 'all',
};

// Helper to generate unique IDs for exercises and sets
export const generateExerciseId = () => `exercise_${uuidv4()}`;
export const generateSetId = () => `set_${uuidv4()}`;

// Helper to create a new empty exercise
export const createEmptyExercise = (): Exercise => ({
  id: generateExerciseId(),
  name: '',
  sets: [createEmptySet()],
});

// Helper to create a new empty set
export const createEmptySet = (): ExerciseSet => ({
  id: generateSetId(),
  reps: undefined,
  weight: undefined,
  unit: 'lbs',
  completed: false,
});

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...initialState,

  fetchWorkouts: async (userId: string, startDate?: string, endDate?: string) => {
    try {
      set({ isLoading: true, error: null });
      const workouts = await window.api.getWorkouts(userId, startDate, endDate);
      set({ workouts, isLoading: false });
    } catch (error) {
      console.error('[WorkoutStore] Failed to fetch workouts:', error);
      set({ error: 'Failed to load workouts', isLoading: false });
    }
  },

  createWorkout: async (workout) => {
    try {
      const newWorkout = await window.api.createWorkout(workout);
      set((state) => ({
        workouts: [newWorkout, ...state.workouts],
      }));
      return newWorkout;
    } catch (error) {
      console.error('[WorkoutStore] Failed to create workout:', error);
      throw error;
    }
  },

  updateWorkout: async (id, updates) => {
    try {
      const updatedWorkout = await window.api.updateWorkout(id, updates);
      set((state) => ({
        workouts: state.workouts.map((w) => (w.id === id ? updatedWorkout : w)),
        selectedWorkout: state.selectedWorkout?.id === id ? updatedWorkout : state.selectedWorkout,
      }));
    } catch (error) {
      console.error('[WorkoutStore] Failed to update workout:', error);
      throw error;
    }
  },

  deleteWorkout: async (id) => {
    try {
      await window.api.deleteWorkout(id);
      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== id),
        selectedWorkout: state.selectedWorkout?.id === id ? null : state.selectedWorkout,
      }));
    } catch (error) {
      console.error('[WorkoutStore] Failed to delete workout:', error);
      throw error;
    }
  },

  setSelectedWorkout: (workout) => {
    set({ selectedWorkout: workout });
  },

  setFilterType: (type) => {
    set({ filterType: type });
  },

  getFilteredWorkouts: () => {
    const { workouts, filterType } = get();
    if (filterType === 'all') return workouts;
    return workouts.filter((w) => w.type === filterType);
  },

  getWorkoutsByDate: (date: string) => {
    return get().workouts.filter((w) => w.date === date);
  },

  getWorkoutStats: () => {
    const { workouts } = get();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeek = workouts.filter((w) => new Date(w.date) >= startOfWeek).length;
    const thisMonth = workouts.filter((w) => new Date(w.date) >= startOfMonth).length;

    const byType: Record<WorkoutType, number> = {
      strength: 0,
      cardio: 0,
      flexibility: 0,
      sports: 0,
      other: 0,
    };

    for (const workout of workouts) {
      byType[workout.type]++;
    }

    return {
      total: workouts.length,
      thisWeek,
      thisMonth,
      byType,
    };
  },

  reset: () => {
    set(initialState);
  },
}));

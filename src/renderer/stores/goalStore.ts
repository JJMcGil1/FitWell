/**
 * Goal Store
 *
 * Manages goals and daily logs for the current user.
 * Re-fetches when user changes.
 */

import { create } from 'zustand';
import type { Goal, DailyLog, Streak, DayStatus } from '../../shared/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';

interface GoalState {
  // Data
  goals: Goal[];
  dailyLogs: Map<string, DailyLog[]>; // Keyed by date (YYYY-MM-DD)
  streaks: Map<string, Streak>; // Keyed by goalId

  // View state
  selectedMonth: Date;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGoals: (userId: string) => Promise<void>;
  fetchLogsForMonth: (userId: string, month: Date) => Promise<void>;
  fetchStreak: (goalId: string) => Promise<Streak>;

  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  toggleDay: (userId: string, goalId: string, date: string) => Promise<void>;
  setSelectedMonth: (month: Date) => void;

  // Computed
  getDayStatus: (date: string) => DayStatus;
  getLogsForDate: (date: string) => DailyLog[];

  // Reset
  reset: () => void;
}

const initialState = {
  goals: [],
  dailyLogs: new Map<string, DailyLog[]>(),
  streaks: new Map<string, Streak>(),
  selectedMonth: new Date(),
  isLoading: false,
  error: null,
};

export const useGoalStore = create<GoalState>((set, get) => ({
  ...initialState,

  fetchGoals: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const goals = await window.api.getGoals(userId);
      set({ goals, isLoading: false });

      // Fetch streaks for all active goals
      const activeGoals = goals.filter((g) => g.isActive);
      const streakPromises = activeGoals.map((g) => get().fetchStreak(g.id));
      await Promise.all(streakPromises);
    } catch (error) {
      console.error('[GoalStore] Failed to fetch goals:', error);
      set({ error: 'Failed to load goals', isLoading: false });
    }
  },

  fetchLogsForMonth: async (userId: string, month: Date) => {
    try {
      const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

      const logs = await window.api.getDailyLogs(userId, startDate, endDate);

      // Group logs by date
      const logsByDate = new Map<string, DailyLog[]>();
      for (const log of logs) {
        const existing = logsByDate.get(log.date) || [];
        existing.push(log);
        logsByDate.set(log.date, existing);
      }

      set({ dailyLogs: logsByDate });
    } catch (error) {
      console.error('[GoalStore] Failed to fetch logs:', error);
      set({ error: 'Failed to load activity data' });
    }
  },

  fetchStreak: async (goalId: string) => {
    const streak = await window.api.getStreak(goalId);
    set((state) => {
      const newStreaks = new Map(state.streaks);
      newStreaks.set(goalId, streak);
      return { streaks: newStreaks };
    });
    return streak;
  },

  createGoal: async (goal) => {
    const newGoal = await window.api.createGoal(goal);
    set((state) => ({ goals: [...state.goals, newGoal] }));
    return newGoal;
  },

  updateGoal: async (id, updates) => {
    const updatedGoal = await window.api.updateGoal(id, updates);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
    }));
  },

  deleteGoal: async (id) => {
    await window.api.deleteGoal(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  toggleDay: async (userId: string, goalId: string, date: string) => {
    try {
      const log = await window.api.toggleDailyLog(userId, goalId, date);

      set((state) => {
        const newLogs = new Map(state.dailyLogs);
        const existingLogs = newLogs.get(date) || [];

        // Update or add the log
        const logIndex = existingLogs.findIndex(
          (l) => l.goalId === goalId
        );
        if (logIndex >= 0) {
          existingLogs[logIndex] = log;
        } else {
          existingLogs.push(log);
        }

        newLogs.set(date, existingLogs);
        return { dailyLogs: newLogs };
      });

      // Refresh streak for this goal
      await get().fetchStreak(goalId);
    } catch (error) {
      console.error('[GoalStore] Failed to toggle day:', error);
      throw error;
    }
  },

  setSelectedMonth: (month: Date) => {
    set({ selectedMonth: month });
  },

  getDayStatus: (date: string): DayStatus => {
    const { dailyLogs, goals } = get();
    const logs = dailyLogs.get(date) || [];
    const activeGoals = goals.filter((g) => g.isActive);

    const completedGoals = logs
      .filter((l) => l.completed)
      .map((l) => l.goalId);

    return {
      date,
      completedGoals,
      totalGoals: activeGoals.length,
      isFullyComplete:
        activeGoals.length > 0 && completedGoals.length === activeGoals.length,
    };
  },

  getLogsForDate: (date: string): DailyLog[] => {
    return get().dailyLogs.get(date) || [];
  },

  reset: () => {
    set(initialState);
  },
}));

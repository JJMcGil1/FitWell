/**
 * IPC Handlers
 *
 * Bridges the renderer process to database operations.
 * All database access MUST go through these handlers.
 */

import { ipcMain } from 'electron';
import * as db from '../database';
import type { Goal, DailyLog, WeightEntry, Workout, Run, AppSettings, UserAchievement, WorkoutTemplate } from '../../shared/types';

export function registerIpcHandlers(): void {
  // ========================================
  // User Handlers
  // ========================================

  ipcMain.handle('users:getAll', () => {
    return db.getUsers();
  });

  ipcMain.handle('users:create', (_, data: { firstName: string; lastName: string; birthday?: string; profilePhoto?: string; avatarColor: string }) => {
    return db.createUser(data);
  });

  ipcMain.handle(
    'users:update',
    (_, id: string, updates: Partial<{ name: string; firstName: string; lastName: string; birthday: string; profilePhoto: string; avatarColor: string }>) => {
      return db.updateUser(id, updates);
    }
  );

  ipcMain.handle('users:delete', (_, id: string) => {
    db.deleteUser(id);
  });

  // ========================================
  // Goal Handlers
  // ========================================

  ipcMain.handle('goals:getAll', (_, userId: string) => {
    return db.getGoals(userId);
  });

  ipcMain.handle(
    'goals:create',
    (_, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
      return db.createGoal(goal);
    }
  );

  ipcMain.handle('goals:update', (_, id: string, updates: Partial<Goal>) => {
    return db.updateGoal(id, updates);
  });

  ipcMain.handle('goals:delete', (_, id: string) => {
    db.deleteGoal(id);
  });

  // ========================================
  // Daily Log Handlers
  // ========================================

  ipcMain.handle(
    'logs:getRange',
    (_, userId: string, startDate: string, endDate: string) => {
      return db.getDailyLogs(userId, startDate, endDate);
    }
  );

  ipcMain.handle(
    'logs:getForDate',
    (_, userId: string, goalId: string, date: string) => {
      return db.getLogForDate(userId, goalId, date);
    }
  );

  ipcMain.handle(
    'logs:toggle',
    (_, userId: string, goalId: string, date: string) => {
      return db.toggleDailyLog(userId, goalId, date);
    }
  );

  ipcMain.handle('logs:update', (_, id: string, updates: Partial<DailyLog>) => {
    return db.updateDailyLog(id, updates);
  });

  // ========================================
  // Weight Handlers
  // ========================================

  ipcMain.handle(
    'weight:getAll',
    (_, userId: string, startDate?: string, endDate?: string) => {
      return db.getWeightEntries(userId, startDate, endDate);
    }
  );

  ipcMain.handle(
    'weight:add',
    (_, entry: Omit<WeightEntry, 'id' | 'createdAt'>) => {
      return db.addWeightEntry(entry);
    }
  );

  ipcMain.handle('weight:delete', (_, id: string) => {
    db.deleteWeightEntry(id);
  });

  // ========================================
  // Workout Handlers
  // ========================================

  ipcMain.handle(
    'workouts:getAll',
    (_, userId: string, startDate?: string, endDate?: string) => {
      return db.getWorkouts(userId, startDate, endDate);
    }
  );

  ipcMain.handle('workouts:get', (_, id: string) => {
    return db.getWorkout(id);
  });

  ipcMain.handle(
    'workouts:create',
    (_, workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
      return db.createWorkout(workout);
    }
  );

  ipcMain.handle(
    'workouts:update',
    (_, id: string, updates: Partial<Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return db.updateWorkout(id, updates);
    }
  );

  ipcMain.handle('workouts:delete', (_, id: string) => {
    db.deleteWorkout(id);
  });

  // ========================================
  // Workout Template Handlers
  // ========================================

  ipcMain.handle('templates:getAll', (_, userId: string) => {
    return db.getWorkoutTemplates(userId);
  });

  ipcMain.handle('templates:get', (_, id: string) => {
    return db.getWorkoutTemplate(id);
  });

  ipcMain.handle(
    'templates:create',
    (_, template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      return db.createWorkoutTemplate(template);
    }
  );

  ipcMain.handle(
    'templates:update',
    (_, id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => {
      return db.updateWorkoutTemplate(id, updates);
    }
  );

  ipcMain.handle('templates:delete', (_, id: string) => {
    db.deleteWorkoutTemplate(id);
  });

  // ========================================
  // Weekly Schedule Handlers
  // ========================================

  ipcMain.handle('schedule:get', (_, userId: string) => {
    return db.getSchedule(userId);
  });

  ipcMain.handle('schedule:set', (_, userId: string, dayOfWeek: number, templateId: string | null) => {
    return db.setScheduleEntry(userId, dayOfWeek, templateId);
  });

  ipcMain.handle('schedule:add', (_, userId: string, dayOfWeek: number, templateId: string) => {
    return db.addScheduleEntry(userId, dayOfWeek, templateId);
  });

  ipcMain.handle('schedule:remove', (_, id: string) => {
    db.removeScheduleEntry(id);
  });

  ipcMain.handle('schedule:clear', (_, userId: string) => {
    db.clearSchedule(userId);
  });

  // ========================================
  // Run Handlers
  // ========================================

  ipcMain.handle(
    'runs:getAll',
    (_, userId: string, startDate?: string, endDate?: string) => {
      return db.getRuns(userId, startDate, endDate);
    }
  );

  ipcMain.handle('runs:get', (_, id: string) => {
    return db.getRun(id);
  });

  ipcMain.handle(
    'runs:create',
    (_, run: Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>) => {
      return db.createRun(run);
    }
  );

  ipcMain.handle(
    'runs:update',
    (_, id: string, updates: Partial<Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>>) => {
      return db.updateRun(id, updates);
    }
  );

  ipcMain.handle('runs:delete', (_, id: string) => {
    db.deleteRun(id);
  });

  // ========================================
  // Computed Data Handlers
  // ========================================

  ipcMain.handle('streak:get', (_, goalId: string) => {
    return db.getStreak(goalId);
  });

  ipcMain.handle('summary:month', (_, userId: string, month: string) => {
    return db.getMonthSummary(userId, month);
  });

  // ========================================
  // Settings Handlers
  // ========================================

  ipcMain.handle('settings:get', () => {
    return db.getSettings();
  });

  ipcMain.handle('settings:update', (_, updates: Partial<AppSettings>) => {
    return db.updateSettings(updates);
  });

  // ========================================
  // Achievement Handlers
  // ========================================

  ipcMain.handle('achievements:getAll', (_, userId: string) => {
    return db.getUserAchievements(userId);
  });

  ipcMain.handle('achievements:unlock', (_, userId: string, achievementId: string) => {
    return db.unlockAchievement(userId, achievementId);
  });

  ipcMain.handle('achievements:getStats', (_, userId: string) => {
    return db.getAchievementStats(userId);
  });

  console.log('[IPC] All handlers registered');
}

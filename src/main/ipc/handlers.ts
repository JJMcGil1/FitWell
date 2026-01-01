/**
 * IPC Handlers
 *
 * Bridges the renderer process to database operations.
 * All database access MUST go through these handlers.
 */

import { ipcMain } from 'electron';
import * as db from '../database';
import type { Goal, DailyLog, WeightEntry, AppSettings } from '../../shared/types';

export function registerIpcHandlers(): void {
  // ========================================
  // User Handlers
  // ========================================

  ipcMain.handle('users:getAll', () => {
    return db.getUsers();
  });

  ipcMain.handle('users:create', (_, name: string, avatarColor: string) => {
    return db.createUser(name, avatarColor);
  });

  ipcMain.handle(
    'users:update',
    (_, id: string, updates: Partial<{ name: string; avatarColor: string }>) => {
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

  console.log('[IPC] All handlers registered');
}

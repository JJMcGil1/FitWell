/**
 * Preload Script
 *
 * Bridge between renderer and main process.
 * Exposes a safe, typed API to the renderer via contextBridge.
 *
 * Security note: This is the ONLY place where IPC is exposed to the renderer.
 * Never expose ipcRenderer directly.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi, Goal, DailyLog, WeightEntry, AppSettings, CreateUserData } from '../shared/types';

// Updater API
const updaterApi = {
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdateChecking: (callback: () => void) => {
    ipcRenderer.on('updater:checking', callback);
    return () => ipcRenderer.removeListener('updater:checking', callback);
  },
  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    const handler = (_: unknown, info: { version: string }) => callback(info);
    ipcRenderer.on('updater:available', handler);
    return () => ipcRenderer.removeListener('updater:available', handler);
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('updater:not-available', callback);
    return () => ipcRenderer.removeListener('updater:not-available', callback);
  },
  onDownloadProgress: (callback: (progress: { percent: number }) => void) => {
    const handler = (_: unknown, progress: { percent: number }) => callback(progress);
    ipcRenderer.on('updater:progress', handler);
    return () => ipcRenderer.removeListener('updater:progress', handler);
  },
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
    const handler = (_: unknown, info: { version: string }) => callback(info);
    ipcRenderer.on('updater:downloaded', handler);
    return () => ipcRenderer.removeListener('updater:downloaded', handler);
  },
  onError: (callback: (error: string) => void) => {
    const handler = (_: unknown, error: string) => callback(error);
    ipcRenderer.on('updater:error', handler);
    return () => ipcRenderer.removeListener('updater:error', handler);
  },
};

const api: IpcApi = {
  // User operations
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (data: CreateUserData) => ipcRenderer.invoke('users:create', data),
  updateUser: (id, updates) => ipcRenderer.invoke('users:update', id, updates),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),

  // Goal operations
  getGoals: (userId) => ipcRenderer.invoke('goals:getAll', userId),
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('goals:create', goal),
  updateGoal: (id, updates) => ipcRenderer.invoke('goals:update', id, updates),
  deleteGoal: (id) => ipcRenderer.invoke('goals:delete', id),

  // Daily log operations
  getDailyLogs: (userId, startDate, endDate) =>
    ipcRenderer.invoke('logs:getRange', userId, startDate, endDate),
  getLogForDate: (userId, goalId, date) =>
    ipcRenderer.invoke('logs:getForDate', userId, goalId, date),
  toggleDailyLog: (userId, goalId, date) =>
    ipcRenderer.invoke('logs:toggle', userId, goalId, date),
  updateDailyLog: (id, updates: Partial<DailyLog>) =>
    ipcRenderer.invoke('logs:update', id, updates),

  // Weight operations
  getWeightEntries: (userId, startDate, endDate) =>
    ipcRenderer.invoke('weight:getAll', userId, startDate, endDate),
  addWeightEntry: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) =>
    ipcRenderer.invoke('weight:add', entry),
  deleteWeightEntry: (id) => ipcRenderer.invoke('weight:delete', id),

  // Computed data
  getStreak: (goalId) => ipcRenderer.invoke('streak:get', goalId),
  getMonthSummary: (userId, month) => ipcRenderer.invoke('summary:month', userId, month),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke('settings:update', settings),
};

contextBridge.exposeInMainWorld('api', api);
contextBridge.exposeInMainWorld('updater', updaterApi);

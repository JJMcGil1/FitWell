/**
 * FitWell Shared Types
 *
 * These types define the contract between main process and renderer.
 * Any changes here affect both sides - be careful.
 */

// ============================================
// Core Domain Types
// ============================================

export interface User {
  id: string;
  name: string; // Full display name (first + last)
  firstName?: string;
  lastName?: string;
  birthday?: string; // YYYY-MM-DD format
  profilePhoto?: string; // Base64 data URL or null
  avatarColor: string; // Hex color for avatar background
  createdAt: string; // ISO date string
}

export type GoalType = 'workout' | 'weight' | 'custom';
export type GoalFrequency = 'daily' | 'weekly';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  frequency: GoalFrequency;
  targetValue?: number; // For weight goals: target weight
  unit?: string; // 'lbs', 'kg', 'minutes', etc.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  goalId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  value?: number; // For numeric goals (weight, duration, etc.)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  weight: number;
  unit: 'lbs' | 'kg';
  notes?: string;
  createdAt: string;
}

// ============================================
// Computed/Derived Types (not stored)
// ============================================

export interface Streak {
  goalId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export interface DayStatus {
  date: string;
  completedGoals: string[]; // Goal IDs
  totalGoals: number;
  isFullyComplete: boolean;
}

export interface MonthSummary {
  month: string; // YYYY-MM
  totalDays: number;
  completedDays: number;
  partialDays: number;
  streakDays: number;
}

// ============================================
// IPC API Types
// ============================================

export interface CreateUserData {
  firstName: string;
  lastName: string;
  birthday?: string;
  profilePhoto?: string;
  avatarColor: string;
}

export interface IpcApi {
  // User operations
  getUsers: () => Promise<User[]>;
  createUser: (data: CreateUserData) => Promise<User>;
  updateUser: (id: string, updates: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'birthday' | 'profilePhoto' | 'avatarColor'>>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  // Goal operations
  getGoals: (userId: string) => Promise<Goal[]>;
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;

  // Daily log operations
  getDailyLogs: (userId: string, startDate: string, endDate: string) => Promise<DailyLog[]>;
  getLogForDate: (userId: string, goalId: string, date: string) => Promise<DailyLog | null>;
  toggleDailyLog: (userId: string, goalId: string, date: string) => Promise<DailyLog>;
  updateDailyLog: (id: string, updates: Partial<DailyLog>) => Promise<DailyLog>;

  // Weight operations
  getWeightEntries: (userId: string, startDate?: string, endDate?: string) => Promise<WeightEntry[]>;
  addWeightEntry: (entry: Omit<WeightEntry, 'id' | 'createdAt'>) => Promise<WeightEntry>;
  deleteWeightEntry: (id: string) => Promise<void>;

  // Computed data
  getStreak: (goalId: string) => Promise<Streak>;
  getMonthSummary: (userId: string, month: string) => Promise<MonthSummary>;

  // App settings
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
}

export interface AppSettings {
  lastActiveUserId: string | null;
  weightUnit: 'lbs' | 'kg';
  theme: 'light' | 'dark' | 'system';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
}

// ============================================
// Updater API Types
// ============================================

export interface UpdaterApi {
  checkForUpdates: () => Promise<unknown>;
  downloadUpdate: () => Promise<unknown>;
  installUpdate: () => void;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (info: { version: string }) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onDownloadProgress: (callback: (progress: { percent: number }) => void) => () => void;
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
}

// ============================================
// Window API Declaration
// ============================================

declare global {
  interface Window {
    api: IpcApi;
    updater: UpdaterApi;
  }
}

export {};

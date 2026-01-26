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
// Workout Types
// ============================================

export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';

export type ExerciseTargetUnit = 'reps' | 'seconds' | 'minutes';

export interface Exercise {
  id: string;
  name: string;
  sets?: ExerciseSet[];
  targetSets?: number; // For routine templates: number of sets
  targetReps?: number; // For routine templates: reps per set (or seconds/minutes when targetUnit is set)
  targetUnit?: ExerciseTargetUnit; // Unit for targetReps: 'reps' (default), 'seconds', or 'minutes' (for planks, holds, etc.)
  tilFailure?: boolean; // For routine templates: do reps until failure
  duration?: number; // minutes (for cardio)
  distance?: number; // miles or km (for cardio)
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  reps?: number;
  weight?: number;
  unit?: 'lbs' | 'kg';
  duration?: number; // seconds (for timed exercises like planks)
  completed: boolean;
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  type: WorkoutType;
  name: string;
  exercises: Exercise[];
  duration?: number; // total duration in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Workout Schedule Types (Weekly Planning)
// ============================================

/**
 * A workout template defines a reusable workout routine
 * e.g., "Leg Day", "Push Day", "Pull Day"
 */
export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  type: WorkoutType;
  exercises: Exercise[];
  color: string; // Hex color for visual identification
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Assigns a workout template to a day of the week
 * dayOfWeek: 0 = Sunday, 1 = Monday, ... 6 = Saturday
 */
export interface ScheduleEntry {
  id: string;
  userId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  templateId: string;
  createdAt: string;
}

/**
 * Full weekly schedule with template details
 */
export interface WeeklySchedule {
  [key: number]: WorkoutTemplate | null; // 0-6 mapped to templates
}

// ============================================
// Cardio Types
// ============================================

export type CardioType = 'running' | 'walking' | 'cycling' | 'stairmaster' | 'elliptical' | 'rowing' | 'swimming' | 'hiit' | 'jump_rope' | 'other';
export type SessionIntensity = 'easy' | 'tempo' | 'interval' | 'long' | 'recovery' | 'race';
export type DistanceUnit = 'miles' | 'km' | 'meters' | 'yards' | 'laps' | 'floors' | 'steps';

// Legacy alias for backward compatibility
export type RunType = SessionIntensity;

export interface Run {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  cardioType?: CardioType; // Type of cardio activity (defaults to 'running' for legacy data)
  type: SessionIntensity; // Intensity/purpose of the session
  distance: number; // distance value in the specified unit
  distanceUnit?: DistanceUnit; // unit for distance (defaults to 'miles' for legacy data)
  duration: number; // minutes
  pace?: number; // minutes per unit (calculated, mainly for running/cycling)
  calories?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  elevation?: number; // feet
  route?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Achievement Types
// ============================================

export type AchievementCategory = 'workout' | 'running' | 'weight' | 'streak' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Achievement definition - static, defined in code
 * These are the possible achievements users can unlock
 */
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string; // SVG icon name or emoji
  requirement: number; // Target value to unlock
  requirementType: 'count' | 'streak' | 'weight_lost' | 'distance' | 'custom';
}

/**
 * User's unlocked achievement - stored in database
 */
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string; // ISO date string
}

/**
 * Achievement with progress - computed at runtime
 */
export interface AchievementProgress {
  definition: AchievementDefinition;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressPercent: number; // 0-100
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

  // Workout operations (historical log)
  getWorkouts: (userId: string, startDate?: string, endDate?: string) => Promise<Workout[]>;
  getWorkout: (id: string) => Promise<Workout | null>;
  createWorkout: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workout>;
  updateWorkout: (id: string, updates: Partial<Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Workout>;
  deleteWorkout: (id: string) => Promise<void>;

  // Workout Template operations (reusable routines)
  getWorkoutTemplates: (userId: string) => Promise<WorkoutTemplate[]>;
  getWorkoutTemplate: (id: string) => Promise<WorkoutTemplate | null>;
  createWorkoutTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WorkoutTemplate>;
  updateWorkoutTemplate: (id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<WorkoutTemplate>;
  deleteWorkoutTemplate: (id: string) => Promise<void>;

  // Weekly Schedule operations
  getSchedule: (userId: string) => Promise<ScheduleEntry[]>;
  setScheduleEntry: (userId: string, dayOfWeek: number, templateId: string | null) => Promise<ScheduleEntry | null>;
  addScheduleEntry: (userId: string, dayOfWeek: number, templateId: string) => Promise<ScheduleEntry>;
  removeScheduleEntry: (id: string) => Promise<void>;
  clearSchedule: (userId: string) => Promise<void>;

  // Run operations
  getRuns: (userId: string, startDate?: string, endDate?: string) => Promise<Run[]>;
  getRun: (id: string) => Promise<Run | null>;
  createRun: (run: Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>) => Promise<Run>;
  updateRun: (id: string, updates: Partial<Omit<Run, 'id' | 'createdAt' | 'updatedAt' | 'pace'>>) => Promise<Run>;
  deleteRun: (id: string) => Promise<void>;

  // Achievement operations
  getUserAchievements: (userId: string) => Promise<UserAchievement[]>;
  unlockAchievement: (userId: string, achievementId: string) => Promise<UserAchievement>;
  getAchievementStats: (userId: string) => Promise<AchievementStats>;

  // Computed data
  getStreak: (goalId: string) => Promise<Streak>;
  getMonthSummary: (userId: string, month: string) => Promise<MonthSummary>;

  // App settings
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
}

/**
 * Achievement statistics for a user
 */
export interface AchievementStats {
  totalWorkouts: number;
  totalRuns: number;
  totalMiles: number;
  currentStreak: number;
  longestStreak: number;
  weightLost: number; // Difference from first to lowest weight
  firstWeightEntry: number | null;
  lowestWeight: number | null;
  latestWeight: number | null;
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

export interface AppInfoApi {
  getVersion: () => Promise<string>;
}

// ============================================
// Window API Declaration
// ============================================

declare global {
  interface Window {
    api: IpcApi;
    updater: UpdaterApi;
    appInfo: AppInfoApi;
  }
}

export {};

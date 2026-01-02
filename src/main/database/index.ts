/**
 * Database Module
 *
 * Handles SQLite database initialization and provides
 * typed query helpers for all database operations.
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SCHEMA, SEED_DATA } from './schema';
import type {
  User,
  Goal,
  DailyLog,
  WeightEntry,
  AppSettings,
  Streak,
  MonthSummary,
} from '../../shared/types';

let db: Database.Database | null = null;

/**
 * Initialize the database connection
 * Creates tables if they don't exist
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'fitwell.db');

  console.log(`[Database] Initializing at: ${dbPath}`);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Better concurrent performance
  db.pragma('foreign_keys = ON');

  // Run schema
  db.exec(SCHEMA);

  // Run migrations for existing databases (add new columns if they don't exist)
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const columnNames = userColumns.map(c => c.name);

  if (!columnNames.includes('first_name')) {
    console.log('[Database] Migrating: Adding first_name column...');
    db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
  }
  if (!columnNames.includes('last_name')) {
    console.log('[Database] Migrating: Adding last_name column...');
    db.exec('ALTER TABLE users ADD COLUMN last_name TEXT');
  }
  if (!columnNames.includes('birthday')) {
    console.log('[Database] Migrating: Adding birthday column...');
    db.exec('ALTER TABLE users ADD COLUMN birthday TEXT');
  }
  if (!columnNames.includes('profile_photo')) {
    console.log('[Database] Migrating: Adding profile_photo column...');
    db.exec('ALTER TABLE users ADD COLUMN profile_photo TEXT');
  }

  // Check if we need to seed
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    console.log('[Database] Seeding initial data...');
    db.exec(SEED_DATA);
  }

  console.log('[Database] Ready');
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================
// User Operations
// ============================================

export function getUsers(): User[] {
  const rows = getDatabase()
    .prepare('SELECT id, name, first_name, last_name, birthday, profile_photo, avatar_color, created_at FROM users ORDER BY created_at')
    .all() as Array<{
      id: string;
      name: string;
      first_name: string | null;
      last_name: string | null;
      birthday: string | null;
      profile_photo: string | null;
      avatar_color: string;
      created_at: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    birthday: row.birthday ?? undefined,
    profilePhoto: row.profile_photo ?? undefined,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  }));
}

interface CreateUserData {
  firstName: string;
  lastName: string;
  birthday?: string;
  profilePhoto?: string;
  avatarColor: string;
}

export function createUser(data: CreateUserData): User {
  const id = `user_${uuidv4()}`;
  const now = new Date().toISOString();
  const name = `${data.firstName} ${data.lastName}`.trim();

  getDatabase()
    .prepare('INSERT INTO users (id, name, first_name, last_name, birthday, profile_photo, avatar_color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, data.firstName, data.lastName, data.birthday ?? null, data.profilePhoto ?? null, data.avatarColor, now);

  // Create default workout goal for new user
  const goalId = `goal_${uuidv4()}`;
  getDatabase()
    .prepare(
      'INSERT INTO goals (id, user_id, name, type, frequency, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(goalId, id, 'Workout', 'workout', 'daily', 1, now, now);

  return {
    id,
    name,
    firstName: data.firstName,
    lastName: data.lastName,
    birthday: data.birthday,
    profilePhoto: data.profilePhoto,
    avatarColor: data.avatarColor,
    createdAt: now,
  };
}

export function updateUser(
  id: string,
  updates: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'birthday' | 'profilePhoto' | 'avatarColor'>>
): User {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.firstName !== undefined) {
    setClauses.push('first_name = ?');
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    setClauses.push('last_name = ?');
    values.push(updates.lastName);
  }
  if (updates.birthday !== undefined) {
    setClauses.push('birthday = ?');
    values.push(updates.birthday ?? null);
  }
  if (updates.profilePhoto !== undefined) {
    setClauses.push('profile_photo = ?');
    values.push(updates.profilePhoto ?? null);
  }
  if (updates.avatarColor !== undefined) {
    setClauses.push('avatar_color = ?');
    values.push(updates.avatarColor);
  }

  // Auto-update name if first/last name changed
  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    // Get current values to combine
    const current = getDatabase()
      .prepare('SELECT first_name, last_name FROM users WHERE id = ?')
      .get(id) as { first_name: string | null; last_name: string | null };

    const firstName = updates.firstName ?? current.first_name ?? '';
    const lastName = updates.lastName ?? current.last_name ?? '';
    const newName = `${firstName} ${lastName}`.trim();

    if (!setClauses.includes('name = ?')) {
      setClauses.push('name = ?');
      values.push(newName);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No updates provided');
  }

  values.push(id);
  getDatabase()
    .prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`)
    .run(...values);

  const row = getDatabase()
    .prepare('SELECT id, name, first_name, last_name, birthday, profile_photo, avatar_color, created_at FROM users WHERE id = ?')
    .get(id) as {
      id: string;
      name: string;
      first_name: string | null;
      last_name: string | null;
      birthday: string | null;
      profile_photo: string | null;
      avatar_color: string;
      created_at: string;
    };

  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    birthday: row.birthday ?? undefined,
    profilePhoto: row.profile_photo ?? undefined,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  };
}

export function deleteUser(id: string): void {
  getDatabase().prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ============================================
// Goal Operations
// ============================================

export function getGoals(userId: string): Goal[] {
  const rows = getDatabase()
    .prepare(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at'
    )
    .all(userId) as Array<{
    id: string;
    user_id: string;
    name: string;
    type: string;
    frequency: string;
    target_value: number | null;
    unit: string | null;
    is_active: number;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as Goal['type'],
    frequency: row.frequency as Goal['frequency'],
    targetValue: row.target_value ?? undefined,
    unit: row.unit ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function createGoal(
  goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
): Goal {
  const id = `goal_${uuidv4()}`;
  const now = new Date().toISOString();

  getDatabase()
    .prepare(
      `INSERT INTO goals (id, user_id, name, type, frequency, target_value, unit, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      goal.userId,
      goal.name,
      goal.type,
      goal.frequency,
      goal.targetValue ?? null,
      goal.unit ?? null,
      goal.isActive ? 1 : 0,
      now,
      now
    );

  return {
    ...goal,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateGoal(id: string, updates: Partial<Goal>): Goal {
  const now = new Date().toISOString();
  const setClauses: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    setClauses.push('type = ?');
    values.push(updates.type);
  }
  if (updates.frequency !== undefined) {
    setClauses.push('frequency = ?');
    values.push(updates.frequency);
  }
  if (updates.targetValue !== undefined) {
    setClauses.push('target_value = ?');
    values.push(updates.targetValue ?? null);
  }
  if (updates.unit !== undefined) {
    setClauses.push('unit = ?');
    values.push(updates.unit ?? null);
  }
  if (updates.isActive !== undefined) {
    setClauses.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }

  values.push(id);
  getDatabase()
    .prepare(`UPDATE goals SET ${setClauses.join(', ')} WHERE id = ?`)
    .run(...values);

  const row = getDatabase().prepare('SELECT * FROM goals WHERE id = ?').get(id) as {
    id: string;
    user_id: string;
    name: string;
    type: string;
    frequency: string;
    target_value: number | null;
    unit: string | null;
    is_active: number;
    created_at: string;
    updated_at: string;
  };

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as Goal['type'],
    frequency: row.frequency as Goal['frequency'],
    targetValue: row.target_value ?? undefined,
    unit: row.unit ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deleteGoal(id: string): void {
  getDatabase().prepare('DELETE FROM goals WHERE id = ?').run(id);
}

// ============================================
// Daily Log Operations
// ============================================

export function getDailyLogs(
  userId: string,
  startDate: string,
  endDate: string
): DailyLog[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM daily_logs
       WHERE user_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC`
    )
    .all(userId, startDate, endDate) as Array<{
    id: string;
    user_id: string;
    goal_id: string;
    date: string;
    completed: number;
    value: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    date: row.date,
    completed: row.completed === 1,
    value: row.value ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getLogForDate(
  userId: string,
  goalId: string,
  date: string
): DailyLog | null {
  const row = getDatabase()
    .prepare(
      'SELECT * FROM daily_logs WHERE user_id = ? AND goal_id = ? AND date = ?'
    )
    .get(userId, goalId, date) as {
    id: string;
    user_id: string;
    goal_id: string;
    date: string;
    completed: number;
    value: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    date: row.date,
    completed: row.completed === 1,
    value: row.value ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toggleDailyLog(
  userId: string,
  goalId: string,
  date: string
): DailyLog {
  const existing = getLogForDate(userId, goalId, date);
  const now = new Date().toISOString();

  if (existing) {
    // Toggle existing log
    const newCompleted = !existing.completed;
    getDatabase()
      .prepare('UPDATE daily_logs SET completed = ?, updated_at = ? WHERE id = ?')
      .run(newCompleted ? 1 : 0, now, existing.id);

    return { ...existing, completed: newCompleted, updatedAt: now };
  } else {
    // Create new log as completed
    const id = `log_${uuidv4()}`;
    getDatabase()
      .prepare(
        `INSERT INTO daily_logs (id, user_id, goal_id, date, completed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, userId, goalId, date, 1, now, now);

    return {
      id,
      userId,
      goalId,
      date,
      completed: true,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export function updateDailyLog(id: string, updates: Partial<DailyLog>): DailyLog {
  const now = new Date().toISOString();
  const setClauses: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (updates.completed !== undefined) {
    setClauses.push('completed = ?');
    values.push(updates.completed ? 1 : 0);
  }
  if (updates.value !== undefined) {
    setClauses.push('value = ?');
    values.push(updates.value ?? null);
  }
  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes ?? null);
  }

  values.push(id);
  getDatabase()
    .prepare(`UPDATE daily_logs SET ${setClauses.join(', ')} WHERE id = ?`)
    .run(...values);

  const row = getDatabase().prepare('SELECT * FROM daily_logs WHERE id = ?').get(id) as {
    id: string;
    user_id: string;
    goal_id: string;
    date: string;
    completed: number;
    value: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };

  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    date: row.date,
    completed: row.completed === 1,
    value: row.value ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// Weight Operations
// ============================================

export function getWeightEntries(
  userId: string,
  startDate?: string,
  endDate?: string
): WeightEntry[] {
  let query = 'SELECT * FROM weight_entries WHERE user_id = ?';
  const params: string[] = [userId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';

  const rows = getDatabase().prepare(query).all(...params) as Array<{
    id: string;
    user_id: string;
    date: string;
    weight: number;
    unit: string;
    notes: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    weight: row.weight,
    unit: row.unit as 'lbs' | 'kg',
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }));
}

export function addWeightEntry(
  entry: Omit<WeightEntry, 'id' | 'createdAt'>
): WeightEntry {
  const id = `weight_${uuidv4()}`;
  const now = new Date().toISOString();

  // Use INSERT OR REPLACE to handle duplicate dates
  getDatabase()
    .prepare(
      `INSERT OR REPLACE INTO weight_entries (id, user_id, date, weight, unit, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, entry.userId, entry.date, entry.weight, entry.unit, entry.notes ?? null, now);

  return { ...entry, id, createdAt: now };
}

export function deleteWeightEntry(id: string): void {
  getDatabase().prepare('DELETE FROM weight_entries WHERE id = ?').run(id);
}

// ============================================
// Computed Data
// ============================================

export function getStreak(goalId: string): Streak {
  // Get all completed logs for this goal, ordered by date descending
  const rows = getDatabase()
    .prepare(
      `SELECT date FROM daily_logs
       WHERE goal_id = ? AND completed = 1
       ORDER BY date DESC`
    )
    .all(goalId) as Array<{ date: string }>;

  if (rows.length === 0) {
    return { goalId, currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }

  const dates = rows.map((r) => r.date);
  const lastCompletedDate = dates[0];

  // Calculate current streak (consecutive days from today or yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let checkDate = dates[0] === today || dates[0] === yesterday ? dates[0] : null;

  if (checkDate) {
    const dateSet = new Set(dates);
    let d = new Date(checkDate);
    while (dateSet.has(d.toISOString().split('T')[0])) {
      currentStreak++;
      d = new Date(d.getTime() - 86400000);
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diff = (prevDate.getTime() - currDate.getTime()) / 86400000;

    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { goalId, currentStreak, longestStreak, lastCompletedDate };
}

export function getMonthSummary(userId: string, month: string): MonthSummary {
  // month format: YYYY-MM
  const startDate = `${month}-01`;
  const endDate = `${month}-31`; // SQLite handles invalid dates gracefully

  const logs = getDailyLogs(userId, startDate, endDate);
  const goals = getGoals(userId).filter((g) => g.isActive);

  // Group logs by date
  const logsByDate = new Map<string, DailyLog[]>();
  for (const log of logs) {
    const existing = logsByDate.get(log.date) || [];
    existing.push(log);
    logsByDate.set(log.date, existing);
  }

  let completedDays = 0;
  let partialDays = 0;

  for (const [, dateLogs] of logsByDate) {
    const completedCount = dateLogs.filter((l) => l.completed).length;
    if (completedCount === goals.length && goals.length > 0) {
      completedDays++;
    } else if (completedCount > 0) {
      partialDays++;
    }
  }

  // Calculate streak days in the month
  const streakDays = logs.filter((l) => l.completed).length;

  // Get actual days in month
  const [year, monthNum] = month.split('-').map(Number);
  const totalDays = new Date(year, monthNum, 0).getDate();

  return { month, totalDays, completedDays, partialDays, streakDays };
}

// ============================================
// Settings
// ============================================

export function getSettings(): AppSettings {
  const row = getDatabase()
    .prepare('SELECT * FROM settings WHERE id = 1')
    .get() as {
    last_active_user_id: string | null;
    weight_unit: string;
    theme: string;
    first_day_of_week: number;
  };

  return {
    lastActiveUserId: row.last_active_user_id,
    weightUnit: row.weight_unit as 'lbs' | 'kg',
    theme: row.theme as 'light' | 'dark' | 'system',
    firstDayOfWeek: row.first_day_of_week as 0 | 1,
  };
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.lastActiveUserId !== undefined) {
    setClauses.push('last_active_user_id = ?');
    values.push(updates.lastActiveUserId);
  }
  if (updates.weightUnit !== undefined) {
    setClauses.push('weight_unit = ?');
    values.push(updates.weightUnit);
  }
  if (updates.theme !== undefined) {
    setClauses.push('theme = ?');
    values.push(updates.theme);
  }
  if (updates.firstDayOfWeek !== undefined) {
    setClauses.push('first_day_of_week = ?');
    values.push(updates.firstDayOfWeek);
  }

  if (setClauses.length > 0) {
    getDatabase()
      .prepare(`UPDATE settings SET ${setClauses.join(', ')} WHERE id = 1`)
      .run(...values);
  }

  return getSettings();
}

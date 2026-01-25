/**
 * SQLite Database Schema
 *
 * Design decisions:
 * - UUIDs as primary keys (portable, no auto-increment conflicts)
 * - ISO date strings for dates (human-readable, sortable)
 * - Soft-delete not implemented (KISS - can add later if needed)
 * - Foreign keys enforced for data integrity
 */

export const SCHEMA = `
-- Enable foreign keys (off by default in SQLite)
PRAGMA foreign_keys = ON;

-- Users table
-- Note: No auth - this is a local app, users are just profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  birthday TEXT,
  profile_photo TEXT,
  avatar_color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Goals table
-- Each user can have multiple goals to track
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workout', 'weight', 'custom')),
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  target_value REAL,
  unit TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily logs table
-- Records goal completion for each day
CREATE TABLE IF NOT EXISTS daily_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  value REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  UNIQUE (user_id, goal_id, date)
);

-- Weight entries table
-- Separate from daily_logs for easier querying and graphing
CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  weight REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('lbs', 'kg')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, date)
);

-- Workouts table
-- Stores workout sessions with exercises as JSON (historical log of completed workouts)
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'cardio', 'flexibility', 'sports', 'other')),
  name TEXT NOT NULL,
  exercises TEXT NOT NULL DEFAULT '[]',
  duration INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workout templates table
-- Stores reusable workout routines (e.g., "Leg Day", "Push Day")
CREATE TABLE IF NOT EXISTS workout_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('strength', 'cardio', 'flexibility', 'sports', 'other')),
  exercises TEXT NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Weekly schedule table
-- Maps days of the week to workout templates
CREATE TABLE IF NOT EXISTS weekly_schedule (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  template_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
  UNIQUE (user_id, day_of_week)
);

-- Runs table
-- Stores running activities with distance, duration, pace
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('easy', 'tempo', 'interval', 'long', 'recovery', 'race')),
  distance REAL NOT NULL,
  duration REAL NOT NULL,
  pace REAL,
  calories INTEGER,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  elevation REAL,
  route TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- App settings (single row table)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_active_user_id TEXT,
  weight_unit TEXT NOT NULL DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  first_day_of_week INTEGER NOT NULL DEFAULT 0 CHECK (first_day_of_week IN (0, 1)),
  FOREIGN KEY (last_active_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User achievements table
-- Tracks which achievements each user has unlocked
-- Achievement definitions are static in code, only unlocks are stored
CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, achievement_id)
);

-- Insert default settings row
INSERT OR IGNORE INTO settings (id) VALUES (1);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_goal_date ON daily_logs(goal_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
CREATE INDEX IF NOT EXISTS idx_runs_user_date ON runs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_user ON weekly_schedule(user_id);
`;

// No seed data needed - users create their own profiles on first launch
export const SEED_DATA = ``;

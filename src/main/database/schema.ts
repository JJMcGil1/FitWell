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

-- App settings (single row table)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_active_user_id TEXT,
  weight_unit TEXT NOT NULL DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  first_day_of_week INTEGER NOT NULL DEFAULT 0 CHECK (first_day_of_week IN (0, 1)),
  FOREIGN KEY (last_active_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings row
INSERT OR IGNORE INTO settings (id) VALUES (1);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_goal_date ON daily_logs(goal_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date);
`;

// No seed data needed - users create their own profiles on first launch
export const SEED_DATA = ``;

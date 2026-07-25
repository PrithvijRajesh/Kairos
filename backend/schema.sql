-- SQLite schema for Kairos (single-user local dev; swap to Postgres later if needed).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  running_goal TEXT NOT NULL DEFAULT '',
  gym_goal TEXT NOT NULL DEFAULT '',
  running_important INTEGER NOT NULL DEFAULT 50 CHECK (running_important >= 0 AND running_important <= 100),
  gym_important INTEGER NOT NULL DEFAULT 50 CHECK (gym_important >= 0 AND gym_important <= 100),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS run_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  log_date TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  duration_min INTEGER,
  distance_mi REAL,
  notes TEXT,
  completed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gym_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  log_date TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  notes TEXT,
  completed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS check_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  check_in_date TEXT NOT NULL,
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  soreness INTEGER NOT NULL CHECK (soreness >= 1 AND soreness <= 5),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_run_logs_user_date ON run_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_gym_logs_user_date ON gym_logs (user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins (user_id, check_in_date);

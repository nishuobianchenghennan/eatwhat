CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'user',
  submitted_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
CREATE INDEX IF NOT EXISTS idx_people_created_at ON people(created_at);

CREATE TABLE IF NOT EXISTS foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'user',
  submitted_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_unique_name_category ON foods(name, COALESCE(category, ''));
CREATE INDEX IF NOT EXISTS idx_foods_status ON foods(status);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_created_at ON foods(created_at);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS spin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT NOT NULL,
  selected_person_id INTEGER,
  selected_person_name TEXT,
  selected_food_id INTEGER,
  selected_food_name TEXT,
  participant_ids TEXT,
  participant_names TEXT,
  candidate_food_ids TEXT,
  candidate_food_names TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spin_logs_mode ON spin_logs(mode);
CREATE INDEX IF NOT EXISTS idx_spin_logs_created_at ON spin_logs(created_at);

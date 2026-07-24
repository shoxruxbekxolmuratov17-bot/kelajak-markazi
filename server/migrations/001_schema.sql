-- Kelajak Markazi — Postgres schema (also mirrored in SQLite relational mode)

CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  district_id TEXT REFERENCES districts(id),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  teacher_id TEXT,
  phone TEXT,
  UNIQUE (district_id, username)
);

CREATE TABLE IF NOT EXISTS parent_pins (
  phone_norm TEXT NOT NULL,
  district_id TEXT NOT NULL REFERENCES districts(id),
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (phone_norm, district_id)
);

CREATE TABLE IF NOT EXISTS center_info (
  district_id TEXT PRIMARY KEY REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS circles (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  name TEXT NOT NULL,
  category TEXT,
  teacher TEXT,
  teacher_id TEXT,
  capacity INT NOT NULL DEFAULT 20,
  enrolled INT NOT NULL DEFAULT 0,
  schedule TEXT,
  location TEXT,
  fee INT NOT NULL DEFAULT 61800,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  is_network BOOLEAN NOT NULL DEFAULT FALSE,
  is_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
  school TEXT,
  age_range TEXT,
  progress INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INT,
  school TEXT,
  grade INT,
  parent_name TEXT,
  parent_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TEXT,
  achievements INT NOT NULL DEFAULT 0,
  social_registry BOOLEAN NOT NULL DEFAULT FALSE,
  inclusive_needs TEXT,
  subsidy BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS student_circles (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, circle_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  student_id TEXT NOT NULL,
  student_name TEXT,
  circle_id TEXT NOT NULL,
  circle_name TEXT,
  amount INT NOT NULL,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  provider TEXT,
  provider_txn TEXT,
  UNIQUE (student_id, circle_id, month)
);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_items (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  title TEXT,
  content TEXT,
  type TEXT,
  date TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  from_name TEXT,
  from_role TEXT,
  from_user_id TEXT,
  to_audience TEXT,
  to_user_id TEXT,
  to_name TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  first_name TEXT,
  last_name TEXT,
  age INT,
  school TEXT,
  grade INT,
  parent_name TEXT,
  parent_phone TEXT,
  circle_id TEXT,
  circle_name TEXT,
  status TEXT,
  submitted_at TEXT,
  note TEXT,
  social_registry BOOLEAN NOT NULL DEFAULT FALSE,
  subsidy BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  student_id TEXT NOT NULL,
  circle_id TEXT NOT NULL,
  date TEXT NOT NULL,
  present BOOLEAN NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS lab_equipment (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS partnerships (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  phone_norm TEXT NOT NULL,
  district_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  PRIMARY KEY (phone_norm, district_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  district_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_phone ON students (parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_district ON students (district_id);
CREATE INDEX IF NOT EXISTS idx_circles_district ON circles (district_id);
CREATE INDEX IF NOT EXISTS idx_payments_district ON payments (district_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages (to_audience, to_user_id);

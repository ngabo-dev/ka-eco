-- Ka-Eco Urban Wetlands Database Schema
-- SQLite Database: wetlands.db
-- This schema is compatible with SQLite

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  role TEXT DEFAULT 'researcher',
  full_name TEXT,
  organization TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Wetlands table
CREATE TABLE IF NOT EXISTS wetlands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  size REAL NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL
);

-- Sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wetland_id INTEGER NOT NULL,
  sensor_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_seen DATETIME,
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  battery_level REAL,
  firmware_version TEXT,
  FOREIGN KEY (wetland_id) REFERENCES wetlands (id)
);

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wetland_id INTEGER NOT NULL,
  species TEXT NOT NULL,
  count INTEGER NOT NULL,
  date DATETIME NOT NULL,
  notes TEXT,
  FOREIGN KEY (wetland_id) REFERENCES wetlands (id)
);

-- Sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id INTEGER,
  wetland_id INTEGER NOT NULL,
  timestamp DATETIME NOT NULL,
  temperature REAL,
  ph REAL,
  dissolved_oxygen REAL,
  turbidity REAL,
  FOREIGN KEY (sensor_id) REFERENCES sensors (id),
  FOREIGN KEY (wetland_id) REFERENCES wetlands (id)
);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, hashed_password, is_active, role, full_name, organization, created_at)
VALUES (1, 'admin', 'admin@ka-eco.rw', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCtBkO2tJcVyO8m', 1, 'admin', 'System Administrator', 'Ka-Eco Organization', CURRENT_TIMESTAMP);

-- Insert sample wetlands
INSERT OR IGNORE INTO wetlands (id, name, location, size, type, description, created_at)
VALUES (1, 'Urban Wetland 1', 'City Center, Kigali', 10.5, 'natural', 'Main urban wetland in Kigali city center', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO wetlands (id, name, location, size, type, description, created_at)
VALUES (2, 'Urban Wetland 2', 'Suburb, Kigali', 5.2, 'constructed', 'Restored wetland in suburban area', CURRENT_TIMESTAMP);

-- Insert sample sensors
INSERT OR IGNORE INTO sensors (id, wetland_id, sensor_id, name, type, status, battery_level, firmware_version, installed_at)
VALUES (1, 1, 'TEMP_PH_DO_001', 'Multi-Parameter Sensor 1', 'multi-parameter', 'active', 85.5, '1.2.3', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO sensors (id, wetland_id, sensor_id, name, type, status, battery_level, firmware_version, installed_at)
VALUES (2, 2, 'TURBIDITY_002', 'Turbidity Sensor 2', 'turbidity', 'active', 92.0, '1.1.0', CURRENT_TIMESTAMP);

-- Insert sample observations
INSERT OR IGNORE INTO observations (id, wetland_id, species, count, date, notes)
VALUES (1, 1, 'Duck', 5, CURRENT_TIMESTAMP, 'Healthy population observed');

INSERT OR IGNORE INTO observations (id, wetland_id, species, count, date, notes)
VALUES (2, 1, 'Frog', 10, CURRENT_TIMESTAMP, 'Active during evening');

INSERT OR IGNORE INTO observations (id, wetland_id, species, count, date, notes)
VALUES (3, 2, 'Heron', 2, CURRENT_TIMESTAMP, 'Migratory species');

-- Insert sample sensor data
INSERT OR IGNORE INTO sensor_data (id, sensor_id, wetland_id, timestamp, temperature, ph, dissolved_oxygen, turbidity)
VALUES (1, 1, 1, CURRENT_TIMESTAMP, 22.5, 7.2, 8.5, 5.0);

INSERT OR IGNORE INTO sensor_data (id, sensor_id, wetland_id, timestamp, temperature, ph, dissolved_oxygen, turbidity)
VALUES (2, 2, 2, CURRENT_TIMESTAMP, 21.0, 7.0, 9.0, 3.0);

INSERT OR IGNORE INTO sensor_data (id, sensor_id, wetland_id, timestamp, temperature, ph, dissolved_oxygen, turbidity)
VALUES (3, 1, 1, CURRENT_TIMESTAMP, 23.0, 7.1, 8.0, 4.5);

-- Add password_changed_at field to users table (referenced in auth.py)
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN with IF NOT EXISTS in older versions
-- You may need to manually add this column if it doesn't exist

-- User settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(user_id, setting_key)
);

-- Insert default user settings for admin user
INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'theme', 'system');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'language', 'en');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'timezone', 'UTC');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'email_notifications', 'true');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'push_notifications', 'true');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'sensor_alerts', 'true');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'weekly_reports', 'true');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'auto_backup', 'true');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'data_retention', '365');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'export_format', 'csv');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'sensor_update_frequency', '15');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'profile_visibility', 'researchers');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'data_sharing', 'false');

INSERT OR IGNORE INTO user_settings (user_id, setting_key, setting_value)
VALUES (1, 'analytics_tracking', 'true');

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  is_active INTEGER DEFAULT 1,
  wetland_id INTEGER,
  sensor_id INTEGER,
  threshold_value REAL,
  actual_value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  acknowledged_by INTEGER,
  acknowledged_at DATETIME,
  FOREIGN KEY (wetland_id) REFERENCES wetlands (id),
  FOREIGN KEY (sensor_id) REFERENCES sensors (id),
  FOREIGN KEY (acknowledged_by) REFERENCES users (id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  alert_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  sent_at DATETIME,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (alert_id) REFERENCES alerts (id)
);

-- Community reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT,
  reporter_phone TEXT,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  location_description TEXT,
  wetland_id INTEGER,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  assigned_to INTEGER,
  images TEXT,  -- JSON string
  evidence_files TEXT,  -- JSON string
  follow_up_required INTEGER DEFAULT 0,
  follow_up_date DATETIME,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wetland_id) REFERENCES wetlands (id),
  FOREIGN KEY (assigned_to) REFERENCES users (id)
);

-- Conservation projects table
CREATE TABLE IF NOT EXISTS conservation_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  budget REAL,
  funding_source TEXT,
  start_date DATE,
  end_date DATE,
  completion_percentage INTEGER DEFAULT 0,
  wetland_id INTEGER,
  lead_organization TEXT,
  partners TEXT,  -- JSON string
  objectives TEXT,  -- JSON string
  expected_outcomes TEXT,  -- JSON string
  actual_outcomes TEXT,  -- JSON string
  challenges TEXT,
  lessons_learned TEXT,
  created_by INTEGER NOT NULL,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wetland_id) REFERENCES wetlands (id),
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (assigned_to) REFERENCES users (id)
);

-- Resource library table
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  category TEXT,
  file_path TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT,  -- JSON string
  is_public INTEGER DEFAULT 1,
  download_count INTEGER DEFAULT 0,
  uploaded_by INTEGER NOT NULL,
  approved_by INTEGER,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users (id),
  FOREIGN KEY (approved_by) REFERENCES users (id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER,
  old_values TEXT,  -- JSON string
  new_values TEXT,  -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ix_sensor_data_timestamp ON sensor_data (timestamp);
CREATE INDEX IF NOT EXISTS ix_sensor_data_wetland_id ON sensor_data (wetland_id);
CREATE INDEX IF NOT EXISTS ix_observations_date ON observations (date);
CREATE INDEX IF NOT EXISTS ix_sensors_status ON sensors (status);
CREATE INDEX IF NOT EXISTS ix_users_role ON users (role);
CREATE INDEX IF NOT EXISTS ix_user_settings_user_id ON user_settings (user_id);
CREATE INDEX IF NOT EXISTS ix_user_settings_key ON user_settings (setting_key);
CREATE INDEX IF NOT EXISTS ix_alerts_created_at ON alerts (created_at);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS ix_community_reports_created_at ON community_reports (created_at);
CREATE INDEX IF NOT EXISTS ix_conservation_projects_created_at ON conservation_projects (created_at);
CREATE INDEX IF NOT EXISTS ix_resources_created_at ON resources (created_at);
CREATE INDEX IF NOT EXISTS ix_audit_logs_timestamp ON audit_logs (timestamp);
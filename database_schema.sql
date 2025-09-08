-- Ka-Eco Urban Wetlands Database Schema
-- MySQL Database: ka-eco

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS `ka-eco`;
-- USE `ka-eco`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `role` varchar(50) DEFAULT 'researcher',
  `full_name` varchar(100) DEFAULT NULL,
  `organization` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_username` (`username`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wetlands table
CREATE TABLE IF NOT EXISTS `wetlands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(200) NOT NULL,
  `size` float NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` text,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_wetlands_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensors table
CREATE TABLE IF NOT EXISTS `sensors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wetland_id` int NOT NULL,
  `sensor_id` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `last_seen` datetime DEFAULT NULL,
  `installed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `battery_level` float DEFAULT NULL,
  `firmware_version` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_sensors_sensor_id` (`sensor_id`),
  KEY `wetland_id` (`wetland_id`),
  CONSTRAINT `sensors_ibfk_1` FOREIGN KEY (`wetland_id`) REFERENCES `wetlands` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Observations table
CREATE TABLE IF NOT EXISTS `observations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wetland_id` int NOT NULL,
  `species` varchar(100) NOT NULL,
  `count` int NOT NULL,
  `date` datetime NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `wetland_id` (`wetland_id`),
  CONSTRAINT `observations_ibfk_1` FOREIGN KEY (`wetland_id`) REFERENCES `wetlands` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sensor data table
CREATE TABLE IF NOT EXISTS `sensor_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sensor_id` int DEFAULT NULL,
  `wetland_id` int NOT NULL,
  `timestamp` datetime NOT NULL,
  `temperature` float DEFAULT NULL,
  `ph` float DEFAULT NULL,
  `dissolved_oxygen` float DEFAULT NULL,
  `turbidity` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sensor_id` (`sensor_id`),
  KEY `wetland_id` (`wetland_id`),
  CONSTRAINT `sensor_data_ibfk_1` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`),
  CONSTRAINT `sensor_data_ibfk_2` FOREIGN KEY (`wetland_id`) REFERENCES `wetlands` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `hashed_password`, `is_active`, `role`, `full_name`, `organization`, `created_at`) VALUES
(1, 'admin', 'admin@ka-eco.rw', '$pbkdf2-sha256$29000$XMvZ.z8nJERIiZHSuhcixA$3hUpJO1iVPgQifknUPrc4ot.pQncAzqtsobjrtxIoag', 1, 'admin', 'System Administrator', 'Ka-Eco Organization', CURRENT_TIMESTAMP);

-- Insert sample wetlands
INSERT IGNORE INTO `wetlands` (`id`, `name`, `location`, `size`, `type`, `description`, `created_at`) VALUES
(1, 'Urban Wetland 1', 'City Center, Kigali', 10.5, 'natural', 'Main urban wetland in Kigali city center', CURRENT_TIMESTAMP),
(2, 'Urban Wetland 2', 'Suburb, Kigali', 5.2, 'constructed', 'Restored wetland in suburban area', CURRENT_TIMESTAMP);

-- Insert sample sensors
INSERT IGNORE INTO `sensors` (`id`, `wetland_id`, `sensor_id`, `name`, `type`, `status`, `battery_level`, `firmware_version`, `installed_at`) VALUES
(1, 1, 'TEMP_PH_DO_001', 'Multi-Parameter Sensor 1', 'multi-parameter', 'active', 85.5, '1.2.3', CURRENT_TIMESTAMP),
(2, 2, 'TURBIDITY_002', 'Turbidity Sensor 2', 'turbidity', 'active', 92.0, '1.1.0', CURRENT_TIMESTAMP);

-- Insert sample observations
INSERT IGNORE INTO `observations` (`id`, `wetland_id`, `species`, `count`, `date`, `notes`) VALUES
(1, 1, 'Duck', 5, CURRENT_TIMESTAMP, 'Healthy population observed'),
(2, 1, 'Frog', 10, CURRENT_TIMESTAMP, 'Active during evening'),
(3, 2, 'Heron', 2, CURRENT_TIMESTAMP, 'Migratory species');

-- Insert sample sensor data
INSERT IGNORE INTO `sensor_data` (`id`, `sensor_id`, `wetland_id`, `timestamp`, `temperature`, `ph`, `dissolved_oxygen`, `turbidity`) VALUES
(1, 1, 1, CURRENT_TIMESTAMP, 22.5, 7.2, 8.5, 5.0),
(2, 2, 2, CURRENT_TIMESTAMP, 21.0, 7.0, 9.0, 3.0),
(3, 1, 1, CURRENT_TIMESTAMP, 23.0, 7.1, 8.0, 4.5);

-- Add password_changed_at field to users table (referenced in auth.py)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password_changed_at` datetime DEFAULT NULL;

-- User settings table for storing user preferences
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_setting` (`user_id`, `setting_key`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default user settings for admin user
INSERT IGNORE INTO `user_settings` (`user_id`, `setting_key`, `setting_value`) VALUES
(1, 'theme', 'system'),
(1, 'language', 'en'),
(1, 'timezone', 'UTC'),
(1, 'email_notifications', 'true'),
(1, 'push_notifications', 'true'),
(1, 'sensor_alerts', 'true'),
(1, 'weekly_reports', 'true'),
(1, 'auto_backup', 'true'),
(1, 'data_retention', '365'),
(1, 'export_format', 'csv'),
(1, 'sensor_update_frequency', '15'),
(1, 'profile_visibility', 'researchers'),
(1, 'data_sharing', 'false'),
(1, 'analytics_tracking', 'true');

-- Alerts table
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `alert_type` varchar(50) NOT NULL,
  `severity` varchar(20) DEFAULT 'medium',
  `is_active` tinyint(1) DEFAULT 1,
  `wetland_id` int DEFAULT NULL,
  `sensor_id` int DEFAULT NULL,
  `threshold_value` float DEFAULT NULL,
  `actual_value` float DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL,
  `acknowledged_by` int DEFAULT NULL,
  `acknowledged_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wetland_id` (`wetland_id`),
  KEY `sensor_id` (`sensor_id`),
  KEY `acknowledged_by` (`acknowledged_by`),
  KEY `ix_alerts_type` (`alert_type`),
  KEY `ix_alerts_severity` (`severity`),
  KEY `ix_alerts_active` (`is_active`),
  CONSTRAINT `alerts_ibfk_1` FOREIGN KEY (`wetland_id`) REFERENCES `wetlands` (`id`),
  CONSTRAINT `alerts_ibfk_2` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`),
  CONSTRAINT `alerts_ibfk_3` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `alert_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `sent_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `alert_id` (`alert_id`),
  KEY `ix_notifications_type` (`notification_type`),
  KEY `ix_notifications_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`alert_id`) REFERENCES `alerts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community reports table
CREATE TABLE IF NOT EXISTS `community_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_name` varchar(100) NOT NULL,
  `reporter_email` varchar(100) DEFAULT NULL,
  `reporter_phone` varchar(20) DEFAULT NULL,
  `report_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `location_description` text,
  `wetland_id` int DEFAULT NULL,
  `severity` varchar(20) DEFAULT 'medium',
  `status` varchar(20) DEFAULT 'pending',
  `priority` varchar(20) DEFAULT 'normal',
  `assigned_to` int DEFAULT NULL,
  `images` json DEFAULT NULL,
  `evidence_files` json DEFAULT NULL,
  `follow_up_required` tinyint(1) DEFAULT 0,
  `follow_up_date` datetime DEFAULT NULL,
  `resolution_notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wetland_id` (`wetland_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `ix_community_reports_type` (`report_type`),
  KEY `ix_community_reports_status` (`status`),
  KEY `ix_community_reports_severity` (`severity`),
  KEY `ix_community_reports_created_at` (`created_at`),
  CONSTRAINT `community_reports_ibfk_1` FOREIGN KEY (`wetland_id`) REFERENCES `wetlands` (`id`),
  CONSTRAINT `community_reports_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conservation projects table
CREATE TABLE IF NOT EXISTS `conservation_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `project_type` varchar(50) NOT NULL,
  `status` varchar(20) DEFAULT 'planning',
  `priority` varchar(20) DEFAULT 'medium',
  `budget` decimal(15,2) DEFAULT NULL,
  `funding_source` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `completion_percentage` int DEFAULT 0,
  `wetland_id` int DEFAULT NULL,
  `lead_organization` varchar(100) DEFAULT NULL,
  `partners` json DEFAULT NULL,
  `objectives` json DEFAULT NULL,
  `expected_outcomes` json DEFAULT NULL,
  `actual_outcomes` json DEFAULT NULL,
  `challenges` text,
  `lessons_learned` text,
  `created_by` int NOT NULL,
  `assigned_to` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wetland_id` (`wetland_id`),
  KEY `created_by` (`created_by`),
  KEY `assigned_to` (`assigned_to`),
  KEY `ix_projects_type` (`project_type`),
  KEY `ix_projects_status` (`status`),
  KEY `ix_projects_start_date` (`start_date`),
  CONSTRAINT `conservation_projects_ibfk_1` FOREIGN KEY (`wetland_id`) REFERENCES `wetlands` (`id`),
  CONSTRAINT `conservation_projects_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `conservation_projects_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resource library table
CREATE TABLE IF NOT EXISTS `resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `resource_type` varchar(50) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `download_count` int DEFAULT 0,
  `uploaded_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `approved_by` (`approved_by`),
  KEY `ix_resources_type` (`resource_type`),
  KEY `ix_resources_category` (`category`),
  KEY `ix_resources_public` (`is_public`),
  CONSTRAINT `resources_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `resources_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resource_type` varchar(50) NOT NULL,
  `resource_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `resource_type` (`resource_type`),
  KEY `resource_id` (`resource_id`),
  KEY `ix_audit_logs_timestamp` (`timestamp`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `ix_sensor_data_timestamp` ON `sensor_data` (`timestamp`);
CREATE INDEX IF NOT EXISTS `ix_sensor_data_wetland_id` ON `sensor_data` (`wetland_id`);
CREATE INDEX IF NOT EXISTS `ix_observations_date` ON `observations` (`date`);
CREATE INDEX IF NOT EXISTS `ix_sensors_status` ON `sensors` (`status`);
CREATE INDEX IF NOT EXISTS `ix_users_role` ON `users` (`role`);
CREATE INDEX IF NOT EXISTS `ix_user_settings_user_id` ON `user_settings` (`user_id`);
CREATE INDEX IF NOT EXISTS `ix_user_settings_key` ON `user_settings` (`setting_key`);
CREATE INDEX IF NOT EXISTS `ix_alerts_created_at` ON `alerts` (`created_at`);
CREATE INDEX IF NOT EXISTS `ix_notifications_created_at` ON `notifications` (`created_at`);
CREATE INDEX IF NOT EXISTS `ix_community_reports_created_at` ON `community_reports` (`created_at`);
CREATE INDEX IF NOT EXISTS `ix_conservation_projects_created_at` ON `conservation_projects` (`created_at`);
CREATE INDEX IF NOT EXISTS `ix_resources_created_at` ON `resources` (`created_at`);
CREATE INDEX IF NOT EXISTS `ix_audit_logs_timestamp` ON `audit_logs` (`timestamp`);
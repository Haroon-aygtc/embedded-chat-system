-- Migration to remove Supabase dependencies and prepare for MySQL migration

-- Create notifications table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create API keys table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  service VARCHAR(100) NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Create API key usage table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS api_key_usage (
  id VARCHAR(36) PRIMARY KEY,
  service VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  response_time_ms INT NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_key_usage_service ON api_key_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_date ON api_key_usage(created_at);

-- Create API rate limits table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id VARCHAR(36) PRIMARY KEY,
  service VARCHAR(100) NOT NULL UNIQUE,
  requests_per_minute INT NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create moderation rules table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS moderation_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('keyword', 'regex', 'ai') NOT NULL,
  pattern TEXT NOT NULL,
  action ENUM('block', 'flag', 'modify') NOT NULL,
  replacement TEXT,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create moderation events table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS moderation_events (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  rule_id VARCHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user bans table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS user_bans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  admin_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  updated_by VARCHAR(36),
  expires_at TIMESTAMP NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_expires ON user_bans(expires_at);

-- Enable realtime for these tables
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table api_keys;
alter publication supabase_realtime add table api_key_usage;
alter publication supabase_realtime add table api_rate_limits;
alter publication supabase_realtime add table moderation_rules;
alter publication supabase_realtime add table moderation_events;
alter publication supabase_realtime add table user_bans;

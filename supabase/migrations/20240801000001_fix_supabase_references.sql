-- This migration fixes any remaining Supabase references by creating MySQL equivalents

-- Create knowledge_base_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS knowledge_base_configs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  api_key VARCHAR(255),
  connection_string TEXT,
  refresh_interval INT,
  last_synced_at TIMESTAMP,
  parameters JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create context_rule_knowledge_bases table if it doesn't exist
CREATE TABLE IF NOT EXISTS context_rule_knowledge_bases (
  id VARCHAR(36) PRIMARY KEY,
  context_rule_id VARCHAR(36) NOT NULL,
  knowledge_base_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (context_rule_id) REFERENCES context_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_base_configs(id) ON DELETE CASCADE
);

-- Create knowledge_base_query_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS knowledge_base_query_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  query TEXT NOT NULL,
  context_rule_id VARCHAR(36),
  knowledge_base_ids TEXT,
  results_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (context_rule_id) REFERENCES context_rules(id) ON DELETE SET NULL
);

-- Create moderation_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS moderation_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,
  action ENUM('flag', 'block', 'replace') NOT NULL,
  replacement TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create flagged_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS flagged_content (
  id VARCHAR(36) PRIMARY KEY,
  content_id VARCHAR(36) NOT NULL,
  content_type ENUM('message', 'user', 'attachment') NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reported_by VARCHAR(36) NOT NULL,
  reviewed_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create user_bans table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_bans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  banned_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE
);

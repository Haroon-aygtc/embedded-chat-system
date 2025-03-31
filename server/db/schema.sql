-- Database Schema for Chat Widget Application

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url VARCHAR(255),
  reset_token VARCHAR(36),
  reset_token_expiry DATETIME,
  metadata JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  last_login_at DATETIME
);

-- User Activities Table
CREATE TABLE IF NOT EXISTS user_activities (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Widget Configurations Table
CREATE TABLE IF NOT EXISTS widget_configs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  primary_color VARCHAR(20) DEFAULT '#0066CC',
  position ENUM('bottom-right', 'bottom-left', 'top-right', 'top-left') DEFAULT 'bottom-right',
  initial_state ENUM('minimized', 'expanded') DEFAULT 'minimized',
  allow_attachments BOOLEAN DEFAULT TRUE,
  allow_voice BOOLEAN DEFAULT TRUE,
  allow_emoji BOOLEAN DEFAULT TRUE,
  context_mode VARCHAR(50) DEFAULT 'default',
  context_rule_id VARCHAR(36),
  welcome_message TEXT,
  placeholder_text VARCHAR(255) DEFAULT 'Type your message here...',
  theme ENUM('light', 'dark', 'system') DEFAULT 'light',
  settings JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Context Rules Table
CREATE TABLE IF NOT EXISTS context_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  context_type VARCHAR(50) NOT NULL,
  keywords JSON,
  excluded_topics JSON,
  prompt_template TEXT,
  response_filters JSON,
  use_knowledge_bases BOOLEAN DEFAULT FALSE,
  knowledge_base_ids JSON,
  preferred_model VARCHAR(50),
  version INT NOT NULL DEFAULT 1,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Knowledge Bases Table
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id VARCHAR(36) NOT NULL,
  source_type VARCHAR(50) DEFAULT 'manual',
  content_type VARCHAR(50) DEFAULT 'text',
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE,
  settings JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Knowledge Base Documents Table
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id VARCHAR(36) PRIMARY KEY,
  knowledge_base_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  source_url VARCHAR(255),
  metadata JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
);

-- Knowledge Base Query Logs Table
CREATE TABLE IF NOT EXISTS knowledge_base_query_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  query TEXT NOT NULL,
  results_count INT NOT NULL DEFAULT 0,
  knowledge_base_ids JSON,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  widget_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  last_activity DATETIME NOT NULL,
  metadata JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (widget_id) REFERENCES widget_configs(id) ON DELETE SET NULL
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  attachments JSON,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- AI Configurations Table
CREATE TABLE IF NOT EXISTS ai_configurations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_model VARCHAR(50) NOT NULL DEFAULT 'openai',
  openai_api_key VARCHAR(255),
  gemini_api_key VARCHAR(255),
  huggingface_api_key VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Interactions Table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id VARCHAR(36) PRIMARY KEY,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
  context_rule_id VARCHAR(36),
  created_at DATETIME NOT NULL,
  FOREIGN KEY (context_rule_id) REFERENCES context_rules(id) ON DELETE SET NULL
);

-- Prompt Templates Table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables JSON,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Response Formats Table
CREATE TABLE IF NOT EXISTS response_formats (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format_type ENUM('markdown', 'html', 'json', 'text') DEFAULT 'markdown',
  template TEXT NOT NULL,
  variables JSON,
  is_active BOOLEAN DEFAULT TRUE,
  branding_enabled BOOLEAN DEFAULT FALSE,
  brand_name VARCHAR(255),
  brand_color VARCHAR(20),
  brand_logo VARCHAR(255),
  structured_data BOOLEAN DEFAULT FALSE,
  data_schema JSON,
  context_rule_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (context_rule_id) REFERENCES context_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_value VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSON,
  last_used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_widget_id ON chat_sessions(widget_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_knowledge_base_documents_kb_id ON knowledge_base_documents(knowledge_base_id);
CREATE INDEX idx_context_rules_user_id ON context_rules(user_id);
CREATE INDEX idx_widget_configs_user_id ON widget_configs(user_id);
CREATE INDEX idx_ai_interactions_model ON ai_interactions(model);
CREATE INDEX idx_ai_interactions_context_rule_id ON ai_interactions(context_rule_id);

-- Create tables with proper indexes and enable real-time

-- AI Interaction Logs
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  context_rule_id UUID REFERENCES context_rules(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  knowledge_base_results INTEGER,
  knowledge_base_ids TEXT[]
);

CREATE INDEX IF NOT EXISTS ai_interaction_logs_user_id_idx ON ai_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_interaction_logs_context_rule_id_idx ON ai_interaction_logs(context_rule_id);
CREATE INDEX IF NOT EXISTS ai_interaction_logs_created_at_idx ON ai_interaction_logs(created_at);

-- Context Rules
CREATE TABLE IF NOT EXISTS context_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  context_type TEXT NOT NULL,
  keywords TEXT[],
  excluded_topics TEXT[],
  prompt_template TEXT,
  response_filters JSONB[],
  preferred_model TEXT,
  use_knowledge_bases BOOLEAN DEFAULT false,
  knowledge_base_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS context_rules_is_active_idx ON context_rules(is_active);

-- Knowledge Base Configurations
CREATE TABLE IF NOT EXISTS knowledge_base_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  endpoint TEXT,
  api_key TEXT,
  connection_string TEXT,
  refresh_interval INTEGER DEFAULT 60,
  last_synced_at TIMESTAMPTZ,
  parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_base_configs_is_active_idx ON knowledge_base_configs(is_active);

-- Context Rule Knowledge Base Junction Table
CREATE TABLE IF NOT EXISTS context_rule_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_rule_id UUID NOT NULL REFERENCES context_rules(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_base_configs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(context_rule_id, knowledge_base_id)
);

CREATE INDEX IF NOT EXISTS context_rule_knowledge_bases_context_rule_id_idx ON context_rule_knowledge_bases(context_rule_id);
CREATE INDEX IF NOT EXISTS context_rule_knowledge_bases_knowledge_base_id_idx ON context_rule_knowledge_bases(knowledge_base_id);

-- Knowledge Base Query Logs
CREATE TABLE IF NOT EXISTS knowledge_base_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  context_rule_id UUID REFERENCES context_rules(id),
  knowledge_base_ids TEXT[],
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_base_query_logs_user_id_idx ON knowledge_base_query_logs(user_id);
CREATE INDEX IF NOT EXISTS knowledge_base_query_logs_created_at_idx ON knowledge_base_query_logs(created_at);

-- Chat Messages for Real-time Communication
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  context_rule_id UUID REFERENCES context_rules(id),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_session_id_idx ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_is_active_idx ON chat_sessions(is_active);

-- Widget Configurations
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS widget_configs_user_id_idx ON widget_configs(user_id);

-- Users Table (for foreign key references)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  organization_id TEXT,
  role TEXT DEFAULT 'user',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Enable real-time for all tables
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table chat_sessions;
alter publication supabase_realtime add table context_rules;
alter publication supabase_realtime add table knowledge_base_configs;
alter publication supabase_realtime add table widget_configs;

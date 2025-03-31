-- Production optimizations for database

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_user_id ON ai_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_created_at ON ai_interaction_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_user_id ON widget_configs(user_id);

-- Optimize table storage
OPTIMIZE TABLE ai_interaction_logs;
OPTIMIZE TABLE chat_sessions;
OPTIMIZE TABLE chat_messages;
OPTIMIZE TABLE widget_configs;
OPTIMIZE TABLE context_rules;
OPTIMIZE TABLE knowledge_base;
OPTIMIZE TABLE prompt_templates;
OPTIMIZE TABLE response_formats;

-- Add foreign key constraints if not already present
ALTER TABLE chat_messages ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_session_id FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE widget_configs ADD CONSTRAINT IF NOT EXISTS fk_widget_configs_context_rule_id FOREIGN KEY (context_rule_id) REFERENCES context_rules(id) ON DELETE SET NULL;

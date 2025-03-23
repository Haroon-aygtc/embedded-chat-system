-- Create knowledge base query logs table
CREATE TABLE IF NOT EXISTS knowledge_base_query_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  query TEXT NOT NULL,
  context_rule_id VARCHAR(36),
  knowledge_base_ids TEXT,
  results_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_kb_query_logs_user ON knowledge_base_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_query_logs_context ON knowledge_base_query_logs(context_rule_id);

-- Enable realtime for this table
alter publication supabase_realtime add table knowledge_base_query_logs;

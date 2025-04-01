-- Create AI Interaction Logs Table
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used VARCHAR(255) NOT NULL,
  context_rule_id UUID REFERENCES context_rules(id),
  knowledge_base_results INTEGER DEFAULT 0,
  knowledge_base_ids TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_model_used ON ai_interaction_logs(model_used);
CREATE INDEX IF NOT EXISTS idx_ai_logs_context_rule_id ON ai_interaction_logs(context_rule_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_interaction_logs(created_at);

-- Enable row-level security
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Admins can view all logs" ON ai_interaction_logs;
CREATE POLICY "Admins can view all logs"
  ON ai_interaction_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can view their own logs" ON ai_interaction_logs;
CREATE POLICY "Users can view their own logs"
  ON ai_interaction_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert logs" ON ai_interaction_logs;
CREATE POLICY "Admins can insert logs"
  ON ai_interaction_logs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Users can insert their own logs" ON ai_interaction_logs;
CREATE POLICY "Users can insert their own logs"
  ON ai_interaction_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime subscriptions
alter publication supabase_realtime add table ai_interaction_logs;

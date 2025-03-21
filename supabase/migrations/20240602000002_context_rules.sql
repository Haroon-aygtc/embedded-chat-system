-- Create context_rules table for AI context management
CREATE TABLE IF NOT EXISTS context_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_context_rules_user_id ON context_rules(user_id);

-- Create trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_context_rules_timestamp ON context_rules;
CREATE TRIGGER update_context_rules_timestamp
BEFORE UPDATE ON context_rules
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Enable realtime for context_rules table
alter publication supabase_realtime add table context_rules;
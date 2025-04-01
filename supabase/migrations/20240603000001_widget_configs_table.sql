-- Create widget_configs table if it doesn't exist already
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for widget_configs table
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own widget configs" ON widget_configs;
DROP POLICY IF EXISTS "Users can create their own widget configs" ON widget_configs;
DROP POLICY IF EXISTS "Users can update their own widget configs" ON widget_configs;
DROP POLICY IF EXISTS "Users can delete their own widget configs" ON widget_configs;

-- Create policies
CREATE POLICY "Users can view their own widget configs"
  ON widget_configs FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own widget configs"
  ON widget_configs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own widget configs"
  ON widget_configs FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own widget configs"
  ON widget_configs FOR DELETE
  USING (auth.uid()::text = user_id);

-- Enable realtime for widget_configs table
ALTER PUBLICATION supabase_realtime ADD TABLE widget_configs;

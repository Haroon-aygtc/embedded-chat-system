-- Create widget configuration tables

-- Widget configurations
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  appearance JSONB NOT NULL DEFAULT '{"theme": "light", "primaryColor": "#3b82f6", "fontFamily": "Inter, sans-serif"}'::jsonb,
  behavior JSONB NOT NULL DEFAULT '{"autoOpen": false, "openDelay": 3000, "position": "bottom-right"}'::jsonb,
  context_rule_id UUID REFERENCES context_rules(id) ON DELETE SET NULL,
  allowed_domains TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Widget embed codes
CREATE TABLE IF NOT EXISTS widget_embed_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widget_configs(id) ON DELETE CASCADE,
  embed_type TEXT NOT NULL, -- 'iframe', 'web-component', 'script'
  code TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Widget usage analytics
CREATE TABLE IF NOT EXISTS widget_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES widget_configs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  domain TEXT,
  page_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  interactions INTEGER NOT NULL DEFAULT 0,
  conversations INTEGER NOT NULL DEFAULT 0,
  avg_conversation_length NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(widget_id, date, domain)
);

-- Enable RLS
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_embed_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can read their own widget configs" ON widget_configs;
CREATE POLICY "Users can read their own widget configs"
  ON widget_configs FOR SELECT
  USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can insert their own widget configs" ON widget_configs;
CREATE POLICY "Users can insert their own widget configs"
  ON widget_configs FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can update their own widget configs" ON widget_configs;
CREATE POLICY "Users can update their own widget configs"
  ON widget_configs FOR UPDATE
  USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can delete their own widget configs" ON widget_configs;
CREATE POLICY "Users can delete their own widget configs"
  ON widget_configs FOR DELETE
  USING (user_id = auth.uid()::TEXT);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE widget_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE widget_embed_codes;

-- Create widget_configs table for chat widget configuration
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  allowed_origins TEXT[],
  appearance JSONB DEFAULT '{"theme": "light", "primaryColor": "#4f46e5", "position": "bottom-right"}'::jsonb,
  behavior JSONB DEFAULT '{"autoOpen": false, "welcomeMessage": "How can I help you today?"}'::jsonb,
  context_rule_id UUID REFERENCES context_rules(id),
  prompt_template_id UUID REFERENCES prompt_templates(id),
  knowledge_base_config_id UUID REFERENCES knowledge_base_configs(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  embed_type TEXT DEFAULT 'iframe', -- 'iframe' or 'web-component'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_widget_configs_user_id ON widget_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_widget_configs_domain ON widget_configs(domain);

-- Create trigger for updating the updated_at timestamp
DROP TRIGGER IF EXISTS update_widget_configs_timestamp ON widget_configs;
CREATE TRIGGER update_widget_configs_timestamp
BEFORE UPDATE ON widget_configs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Enable realtime for widget_configs table
alter publication supabase_realtime add table widget_configs;
-- Create context_rules table
CREATE TABLE IF NOT EXISTS context_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  context_type TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  excluded_topics TEXT[],
  prompt_template TEXT,
  response_filters JSONB,
  use_knowledge_bases BOOLEAN DEFAULT false,
  knowledge_base_ids TEXT[],
  preferred_model TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create context_rule_versions table for version control
CREATE TABLE IF NOT EXISTS context_rule_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES context_rules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create prompt_templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  category TEXT,
  variables TEXT[],
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create prompt_template_versions table for version control
CREATE TABLE IF NOT EXISTS prompt_template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on tables
ALTER TABLE context_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_template_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all users to read context_rules" ON context_rules;
CREATE POLICY "Allow all users to read context_rules"
  ON context_rules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage context_rules" ON context_rules;
CREATE POLICY "Allow authenticated users to manage context_rules"
  ON context_rules FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all users to read context_rule_versions" ON context_rule_versions;
CREATE POLICY "Allow all users to read context_rule_versions"
  ON context_rule_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert context_rule_versions" ON context_rule_versions;
CREATE POLICY "Allow authenticated users to insert context_rule_versions"
  ON context_rule_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all users to read prompt_templates" ON prompt_templates;
CREATE POLICY "Allow all users to read prompt_templates"
  ON prompt_templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage prompt_templates" ON prompt_templates;
CREATE POLICY "Allow authenticated users to manage prompt_templates"
  ON prompt_templates FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all users to read prompt_template_versions" ON prompt_template_versions;
CREATE POLICY "Allow all users to read prompt_template_versions"
  ON prompt_template_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert prompt_template_versions" ON prompt_template_versions;
CREATE POLICY "Allow authenticated users to insert prompt_template_versions"
  ON prompt_template_versions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add to realtime publication
alter publication supabase_realtime add table context_rules;
alter publication supabase_realtime add table context_rule_versions;
alter publication supabase_realtime add table prompt_templates;
alter publication supabase_realtime add table prompt_template_versions;

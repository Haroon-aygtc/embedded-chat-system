-- Create knowledge base tables

-- Knowledge base configurations
CREATE TABLE IF NOT EXISTS knowledge_base_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'api', 'database', 'cms', 'vector', 'file'
  endpoint TEXT, -- API endpoint for external knowledge bases
  api_key TEXT, -- API key for external knowledge bases
  connection_string TEXT, -- For database connections
  parameters JSONB, -- Additional parameters for the knowledge base
  refresh_interval INTEGER, -- How often to refresh the knowledge base (in minutes)
  last_synced_at TIMESTAMPTZ, -- When the knowledge base was last synced
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge base documents
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_base_configs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding JSONB, -- Store embeddings as JSONB instead of VECTOR
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on knowledge base documents
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_kb_id ON knowledge_base_documents(knowledge_base_id);

-- Link between context rules and knowledge bases
CREATE TABLE IF NOT EXISTS context_rule_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_rule_id UUID NOT NULL REFERENCES context_rules(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_base_configs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(context_rule_id, knowledge_base_id)
);

-- Knowledge base query logs
CREATE TABLE IF NOT EXISTS knowledge_base_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  context_rule_id UUID REFERENCES context_rules(id) ON DELETE SET NULL,
  knowledge_base_ids TEXT[], -- Array of knowledge base IDs used
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE knowledge_base_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_rule_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_query_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access for knowledge_base_configs" ON knowledge_base_configs;
CREATE POLICY "Public read access for knowledge_base_configs"
  ON knowledge_base_configs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for knowledge_base_documents" ON knowledge_base_documents;
CREATE POLICY "Public read access for knowledge_base_documents"
  ON knowledge_base_documents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for context_rule_knowledge_bases" ON context_rule_knowledge_bases;
CREATE POLICY "Public read access for context_rule_knowledge_bases"
  ON context_rule_knowledge_bases FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_base_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_base_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE context_rule_knowledge_bases;

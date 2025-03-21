-- Create knowledge_base_configs table for knowledge base management
CREATE TABLE IF NOT EXISTS knowledge_base_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL, -- 'file', 'url', 'text', etc.
  source_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding_model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create knowledge_base_documents table for storing documents
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id UUID NOT NULL REFERENCES knowledge_base_configs(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536), -- For OpenAI embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_configs_user_id ON knowledge_base_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_config_id ON knowledge_base_documents(config_id);

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_knowledge_base_configs_timestamp ON knowledge_base_configs;
CREATE TRIGGER update_knowledge_base_configs_timestamp
BEFORE UPDATE ON knowledge_base_configs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_knowledge_base_documents_timestamp ON knowledge_base_documents;
CREATE TRIGGER update_knowledge_base_documents_timestamp
BEFORE UPDATE ON knowledge_base_documents
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Enable realtime for knowledge base tables
alter publication supabase_realtime add table knowledge_base_configs;
alter publication supabase_realtime add table knowledge_base_documents;
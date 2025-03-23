-- Create AI response cache table
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id VARCHAR(36) PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(cache_key)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache(expires_at);

-- Enable realtime for this table
alter publication supabase_realtime add table ai_response_cache;

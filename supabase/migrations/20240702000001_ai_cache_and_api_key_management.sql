-- Create table for API key rotation history
CREATE TABLE IF NOT EXISTS api_key_rotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_type TEXT NOT NULL,
  rotated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  rotated_by TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for AI response caching
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for efficient cache lookups
CREATE INDEX IF NOT EXISTS ai_response_cache_prompt_hash_idx ON ai_response_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS ai_response_cache_expires_at_idx ON ai_response_cache(expires_at);

-- Add rate limiting settings to system_settings if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM system_settings WHERE category = 'rate_limits'
  ) THEN
    INSERT INTO system_settings (category, settings, environment)
    VALUES (
      'rate_limits',
      jsonb_build_object(
        'gemini_requests_per_minute', 60,
        'huggingface_requests_per_minute', 60,
        'total_requests_per_day', 10000,
        'max_tokens_per_request', 4096
      ),
      'production'
    );
  END IF;
END
$$;

-- Enable realtime for the new tables
alter publication supabase_realtime add table api_key_rotations;

-- Create response_formats table
CREATE TABLE IF NOT EXISTS response_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format_type VARCHAR(50) NOT NULL,
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  branding_enabled BOOLEAN DEFAULT FALSE,
  brand_name VARCHAR(255),
  brand_color VARCHAR(50),
  brand_logo TEXT,
  structured_data BOOLEAN DEFAULT FALSE,
  data_schema TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  context_rule_id UUID,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_response_formats_context_rule_id ON response_formats(context_rule_id);
CREATE INDEX IF NOT EXISTS idx_response_formats_user_id ON response_formats(user_id);

-- Add foreign key constraint if context_rules table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'context_rules') THEN
    ALTER TABLE response_formats
    ADD CONSTRAINT fk_response_formats_context_rule
    FOREIGN KEY (context_rule_id)
    REFERENCES context_rules(id)
    ON DELETE SET NULL;
  END IF;
END
$$;

-- Add foreign key constraint if users table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE response_formats
    ADD CONSTRAINT fk_response_formats_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL;
  END IF;
END
$$;

-- Add response_format_id column to context_rules table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'context_rules') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'context_rules' AND column_name = 'response_format_id') THEN
      ALTER TABLE context_rules ADD COLUMN response_format_id UUID REFERENCES response_formats(id) ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- Enable realtime for response_formats table
alter publication supabase_realtime add table response_formats;

-- Insert some sample response formats
INSERT INTO response_formats (name, description, format_type, template, variables, is_active)
VALUES 
('JSON Response', 'Standard JSON response format with content and metadata', 'json', 
'{
  "content": "{{content}}",
  "metadata": {
    "query": "{{query}}",
    "timestamp": "{{timestamp}}"
  }
}', 
'["content", "query", "timestamp"]', true),

('Markdown Response', 'Formatted markdown response with headers and sections', 'markdown', 
'# Response to: {{query}}

{{content}}

---
*Generated at {{timestamp}}*', 
'["content", "query", "timestamp"]', true),

('HTML Response', 'HTML formatted response with styling', 'html', 
'<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
  <h2 style="color: #333;">{{query}}</h2>
  <div style="margin: 20px 0; line-height: 1.6;">
    {{content}}
  </div>
  <div style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
    Generated at {{timestamp}}
  </div>
</div>', 
'["content", "query", "timestamp"]', true);

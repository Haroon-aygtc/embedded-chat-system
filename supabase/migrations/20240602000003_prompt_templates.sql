-- Create prompt_templates table for AI prompt management
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);

-- Create trigger for updating the updated_at timestamp
DROP TRIGGER IF EXISTS update_prompt_templates_timestamp ON prompt_templates;
CREATE TRIGGER update_prompt_templates_timestamp
BEFORE UPDATE ON prompt_templates
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Enable realtime for prompt_templates table
alter publication supabase_realtime add table prompt_templates;
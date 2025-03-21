# Supabase Integration

## Production Setup

To replace the mock Supabase client with a real implementation:

1. Create a Supabase project at https://supabase.com
2. Set up the following environment variables in your project settings:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Schema

The application requires the following tables in your Supabase database:

### ai_interaction_logs
- id (uuid, primary key)
- user_id (text)
- query (text)
- response (text)
- model_used (text)
- context_rule_id (uuid, foreign key to context_rules.id, nullable)
- metadata (jsonb)
- created_at (timestamp with time zone)
- knowledge_base_results (integer, nullable)
- knowledge_base_ids (text[], nullable)

### context_rules
- id (uuid, primary key)
- name (text)
- description (text)
- is_active (boolean)
- context_type (text)
- keywords (text[])
- excluded_topics (text[])
- prompt_template (text, nullable)
- response_filters (jsonb[])
- preferred_model (text, nullable)
- use_knowledge_bases (boolean)
- knowledge_base_ids (text[])
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### knowledge_base_configs
- id (uuid, primary key)
- name (text)
- type (text)
- endpoint (text, nullable)
- api_key (text, nullable)
- connection_string (text, nullable)
- refresh_interval (integer)
- last_synced_at (timestamp with time zone, nullable)
- parameters (jsonb)
- is_active (boolean)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### context_rule_knowledge_bases
- id (uuid, primary key)
- context_rule_id (uuid, foreign key to context_rules.id)
- knowledge_base_id (uuid, foreign key to knowledge_base_configs.id)
- created_at (timestamp with time zone)

### knowledge_base_query_logs
- id (uuid, primary key)
- user_id (text)
- query (text)
- context_rule_id (uuid, foreign key to context_rules.id, nullable)
- knowledge_base_ids (text[])
- results_count (integer)
- created_at (timestamp with time zone)

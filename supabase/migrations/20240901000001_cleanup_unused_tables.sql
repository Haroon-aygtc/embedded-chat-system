-- This migration cleans up unused tables and references from the Supabase migration
-- as we've fully migrated to MySQL

-- Drop unused tables if they exist
DROP TABLE IF EXISTS supabase_migrations;
DROP TABLE IF EXISTS supabase_functions;
DROP TABLE IF EXISTS supabase_hooks;

-- Remove any remaining Supabase-specific extensions
DROP EXTENSION IF EXISTS pg_graphql;
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS pgjwt;
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Update any remaining references to Supabase in system settings
UPDATE system_settings 
SET settings = JSON_REMOVE(settings, '$.supabaseUrl', '$.supabaseKey', '$.supabaseServiceKey')
WHERE JSON_CONTAINS_PATH(settings, 'one', '$.supabaseUrl');

-- Add MySQL-specific settings if needed
UPDATE system_settings
SET settings = JSON_SET(settings, '$.databaseType', 'mysql')
WHERE category = 'system';
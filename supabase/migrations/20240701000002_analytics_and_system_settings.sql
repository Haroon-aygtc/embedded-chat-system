-- Create analytics_data table
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_response_time FLOAT DEFAULT 0,
  satisfaction_rate FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_messages_by_day table
CREATE TABLE IF NOT EXISTS analytics_messages_by_day (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_top_queries table
CREATE TABLE IF NOT EXISTS analytics_top_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_model_usage table
CREATE TABLE IF NOT EXISTS analytics_model_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  percentage FLOAT DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  settings JSONB NOT NULL,
  environment TEXT DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create system_settings_history table for version control
CREATE TABLE IF NOT EXISTS system_settings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID NOT NULL REFERENCES system_settings(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on tables
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_messages_by_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_top_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings_history ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow authenticated users to read analytics_data" ON analytics_data;
CREATE POLICY "Allow authenticated users to read analytics_data"
  ON analytics_data FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read analytics_messages_by_day" ON analytics_messages_by_day;
CREATE POLICY "Allow authenticated users to read analytics_messages_by_day"
  ON analytics_messages_by_day FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read analytics_top_queries" ON analytics_top_queries;
CREATE POLICY "Allow authenticated users to read analytics_top_queries"
  ON analytics_top_queries FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read analytics_model_usage" ON analytics_model_usage;
CREATE POLICY "Allow authenticated users to read analytics_model_usage"
  ON analytics_model_usage FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read system_settings" ON system_settings;
CREATE POLICY "Allow authenticated users to read system_settings"
  ON system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage system_settings" ON system_settings;
CREATE POLICY "Allow authenticated users to manage system_settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read system_settings_history" ON system_settings_history;
CREATE POLICY "Allow authenticated users to read system_settings_history"
  ON system_settings_history FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert system_settings_history" ON system_settings_history;
CREATE POLICY "Allow authenticated users to insert system_settings_history"
  ON system_settings_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add to realtime publication
alter publication supabase_realtime add table analytics_data;
alter publication supabase_realtime add table analytics_messages_by_day;
alter publication supabase_realtime add table analytics_top_queries;
alter publication supabase_realtime add table analytics_model_usage;
alter publication supabase_realtime add table system_settings;
alter publication supabase_realtime add table system_settings_history;

-- Insert some initial data for testing
INSERT INTO analytics_data (date, total_conversations, total_messages, average_response_time, satisfaction_rate)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 1100, 8200, 1.3, 90),
  (CURRENT_DATE - INTERVAL '5 days', 1150, 8400, 1.25, 91),
  (CURRENT_DATE - INTERVAL '4 days', 1180, 8600, 1.2, 92),
  (CURRENT_DATE - INTERVAL '3 days', 1200, 8700, 1.2, 92),
  (CURRENT_DATE - INTERVAL '2 days', 1220, 8800, 1.15, 93),
  (CURRENT_DATE - INTERVAL '1 day', 1230, 8900, 1.1, 94),
  (CURRENT_DATE, 1248, 8976, 1.2, 92);

INSERT INTO analytics_messages_by_day (date, count)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 1200),
  (CURRENT_DATE - INTERVAL '5 days', 1300),
  (CURRENT_DATE - INTERVAL '4 days', 1250),
  (CURRENT_DATE - INTERVAL '3 days', 1400),
  (CURRENT_DATE - INTERVAL '2 days', 1350),
  (CURRENT_DATE - INTERVAL '1 day', 1450),
  (CURRENT_DATE, 1500);

INSERT INTO analytics_top_queries (query, count)
VALUES 
  ('How to embed chat widget', 145),
  ('Reset password', 112),
  ('Pricing plans', 98),
  ('API documentation', 87),
  ('Context rules examples', 76),
  ('Custom styling', 65),
  ('Integration with WordPress', 58),
  ('Mobile support', 52),
  ('Data privacy', 47),
  ('Offline mode', 41);

INSERT INTO analytics_model_usage (model, count, percentage, date)
VALUES 
  ('Gemini', 6248, 70, CURRENT_DATE),
  ('Hugging Face', 2728, 30, CURRENT_DATE);

-- Insert initial system settings
INSERT INTO system_settings (category, settings, environment)
VALUES 
  ('general', '{"siteName": "Context-Aware Chat System", "siteDescription": "Embeddable AI chat widget with context awareness", "supportEmail": "support@example.com", "logoUrl": "https://example.com/logo.png", "faviconUrl": "https://example.com/favicon.ico", "maintenanceMode": false, "defaultLanguage": "en", "timeZone": "UTC", "dateFormat": "MM/DD/YYYY", "timeFormat": "12h"}'::jsonb, 'production'),
  ('security', '{"enableMfa": false, "sessionTimeout": 60, "maxLoginAttempts": 5, "passwordPolicy": {"minLength": 8, "requireUppercase": true, "requireLowercase": true, "requireNumbers": true, "requireSpecialChars": true, "passwordExpiry": 90}, "ipRestrictions": ""}'::jsonb, 'production'),
  ('email', '{"smtpHost": "smtp.example.com", "smtpPort": 587, "smtpUsername": "smtp_user", "smtpPassword": "", "smtpSecure": true, "fromEmail": "no-reply@example.com", "fromName": "Chat System"}'::jsonb, 'production'),
  ('backup', '{"enableAutomaticBackups": true, "backupFrequency": "daily", "backupTime": "02:00", "retentionPeriod": 30, "backupLocation": "local", "s3Bucket": "", "s3Region": "", "s3AccessKey": "", "s3SecretKey": ""}'::jsonb, 'production'),
  ('logging', '{"logLevel": "info", "enableAuditLogs": true, "logRetention": 30, "enableErrorReporting": true, "errorReportingEmail": ""}'::jsonb, 'production');

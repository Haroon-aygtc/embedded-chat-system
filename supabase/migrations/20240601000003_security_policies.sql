-- Security policies for tables

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view their own chat messages" ON chat_messages;
CREATE POLICY "Users can view their own chat messages"
ON chat_messages FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chat_messages;
CREATE POLICY "Users can insert their own chat messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Chat sessions policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view their own chat sessions"
ON chat_sessions FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can manage their own chat sessions"
ON chat_sessions FOR ALL
USING (auth.uid()::text = user_id);

-- Widget configs policies
DROP POLICY IF EXISTS "Users can view their own widget configs" ON widget_configs;
CREATE POLICY "Users can view their own widget configs"
ON widget_configs FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage their own widget configs" ON widget_configs;
CREATE POLICY "Users can manage their own widget configs"
ON widget_configs FOR ALL
USING (auth.uid()::text = user_id);

-- Enable Row Level Security on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

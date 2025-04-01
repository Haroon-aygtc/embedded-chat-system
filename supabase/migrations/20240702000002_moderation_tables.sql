-- Create moderation_rules table
CREATE TABLE IF NOT EXISTS moderation_rules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('flag', 'block', 'replace')),
  replacement TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Create flagged_content table
CREATE TABLE IF NOT EXISTS flagged_content (
  id UUID PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'user', 'attachment')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reported_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Create user_bans table
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ
);

-- Create chat_attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'file', 'audio', 'video')),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL
);

-- Add status column to chat_messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chat_messages' 
                 AND column_name = 'status') THEN
    ALTER TABLE chat_messages ADD COLUMN status TEXT CHECK (status IN ('pending', 'delivered', 'read', 'moderated'));
  END IF;
END $$;

-- Enable RLS on the tables
ALTER TABLE moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation_rules
CREATE POLICY "Admins can manage moderation rules"
  ON moderation_rules
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin'));

CREATE POLICY "Everyone can view active moderation rules"
  ON moderation_rules
  FOR SELECT
  USING (is_active = true);

-- Create policies for flagged_content
CREATE POLICY "Admins can manage flagged content"
  ON flagged_content
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin'));

CREATE POLICY "Users can view their own reported content"
  ON flagged_content
  FOR SELECT
  USING (reported_by = auth.uid());

-- Create policies for user_bans
CREATE POLICY "Admins can manage user bans"
  ON user_bans
  USING (auth.uid() IN (SELECT auth_id FROM users WHERE role = 'admin'));

-- Create policies for chat_attachments
CREATE POLICY "Users can view attachments in their sessions"
  ON chat_attachments
  FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM chat_messages 
      WHERE session_id IN (
        SELECT session_id FROM chat_sessions WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload attachments"
  ON chat_attachments
  FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for attachments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'chat-attachments') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true);
  END IF;
END $$;

-- Enable realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE flagged_content;
ALTER PUBLICATION supabase_realtime ADD TABLE user_bans;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_attachments;

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  widget_config_id UUID REFERENCES widget_configs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_widget_config_id ON analytics_events(widget_config_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Create analytics_aggregates table for pre-computed analytics
CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  widget_config_id UUID REFERENCES widget_configs(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_user_id ON analytics_aggregates(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_widget_config_id ON analytics_aggregates(widget_config_id);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_metric_name ON analytics_aggregates(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_period_start ON analytics_aggregates(period_start);

-- Create trigger for updating the updated_at timestamp
DROP TRIGGER IF EXISTS update_analytics_aggregates_timestamp ON analytics_aggregates;
CREATE TRIGGER update_analytics_aggregates_timestamp
BEFORE UPDATE ON analytics_aggregates
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Enable realtime for analytics tables
alter publication supabase_realtime add table analytics_events;
alter publication supabase_realtime add table analytics_aggregates;
-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, limits, is_active)
VALUES
  ('Free', 'Basic features for personal use', 0, 0, 
   '{"chatWidget": true, "basicAnalytics": true}'::jsonb, 
   '{"messagesPerMonth": 100, "activeWidgets": 1}'::jsonb, 
   true),
  ('Pro', 'Advanced features for professionals', 29, 290, 
   '{"chatWidget": true, "basicAnalytics": true, "advancedAnalytics": true, "customization": true, "knowledgeBase": true}'::jsonb, 
   '{"messagesPerMonth": 1000, "activeWidgets": 3}'::jsonb, 
   true),
  ('Business', 'Enterprise-grade features for teams', 99, 990, 
   '{"chatWidget": true, "basicAnalytics": true, "advancedAnalytics": true, "customization": true, "knowledgeBase": true, "multiUser": true, "prioritySupport": true}'::jsonb, 
   '{"messagesPerMonth": 10000, "activeWidgets": 10}'::jsonb, 
   true);

-- Insert sample context rules
INSERT INTO users (email, full_name, role, is_active)
VALUES ('admin@example.com', 'Admin User', 'admin', true);

DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'admin@example.com';
  
  -- Insert sample context rules
  INSERT INTO context_rules (user_id, name, description, rules, is_active)
  VALUES 
    (admin_id, 'General Support', 'General customer support context', 
     '{"topics": ["product", "pricing", "support"], "tone": "helpful", "maxResponseLength": 500}'::jsonb, 
     true),
    (admin_id, 'Technical Support', 'Technical troubleshooting context', 
     '{"topics": ["technical", "troubleshooting", "errors"], "tone": "technical", "maxResponseLength": 1000}'::jsonb, 
     true);

  -- Insert sample prompt templates
  INSERT INTO prompt_templates (user_id, name, description, template, variables, category, is_active)
  VALUES 
    (admin_id, 'Welcome Message', 'Initial greeting for new users', 
     'Hello! Welcome to {{company_name}}. How can I assist you today?', 
     '[{"name": "company_name", "description": "Name of the company"}]'::jsonb, 
     'greeting', 
     true),
    (admin_id, 'Product Information', 'Information about products', 
     'Here is information about {{product_name}}: {{product_description}}', 
     '[{"name": "product_name", "description": "Name of the product"}, {"name": "product_description", "description": "Description of the product"}]'::jsonb, 
     'product', 
     true);

  -- Insert sample widget config
  INSERT INTO widget_configs (user_id, name, domain, appearance, behavior, is_active)
  VALUES 
    (admin_id, 'Default Widget', 'example.com', 
     '{"theme": "light", "primaryColor": "#4f46e5", "position": "bottom-right"}'::jsonb, 
     '{"autoOpen": false, "welcomeMessage": "How can I help you today?"}'::jsonb, 
     true);
END $$;
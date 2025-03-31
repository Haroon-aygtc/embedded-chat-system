-- Consolidated migration file that ensures all tables exist
-- This helps prevent duplicate table creation attempts

-- Prompt Templates Table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables JSON,
  examples JSON,
  category VARCHAR(100) DEFAULT 'general',
  metadata JSON,
  is_active BOOLEAN DEFAULT TRUE,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
);

-- Response Formats Table
CREATE TABLE IF NOT EXISTS response_formats (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format_type ENUM('json', 'markdown', 'html', 'text') DEFAULT 'markdown',
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  branding_enabled BOOLEAN DEFAULT FALSE,
  brand_name VARCHAR(255),
  brand_color VARCHAR(50),
  brand_logo TEXT,
  structured_data BOOLEAN DEFAULT FALSE,
  data_schema TEXT,
  variables JSON,
  context_rule_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_context_rule_id (context_rule_id)
);

-- Scrape Jobs Table
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id VARCHAR(36) PRIMARY KEY,
  url TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('in-progress', 'completed', 'failed') DEFAULT 'in-progress',
  progress INT DEFAULT 0,
  error TEXT,
  data JSON,
  metadata JSON,
  ai_analysis JSON,
  export_path VARCHAR(255),
  vector_store_url VARCHAR(255),
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Scrape Vectors Table
CREATE TABLE IF NOT EXISTS scrape_vectors (
  id VARCHAR(36) PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSON,
  embedding JSON,
  job_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_id (job_id),
  FOREIGN KEY (job_id) REFERENCES scrape_jobs(id) ON DELETE CASCADE
);

-- Scrape Datasets Table
CREATE TABLE IF NOT EXISTS scrape_datasets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  item_count INT DEFAULT 0,
  metadata JSON,
  user_id VARCHAR(36),
  INDEX idx_user_id (user_id),
  INDEX idx_name (name)
);

-- Scrape Dataset Items Table
CREATE TABLE IF NOT EXISTS scrape_dataset_items (
  id VARCHAR(36) PRIMARY KEY,
  dataset_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  item_index INT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dataset_id (dataset_id),
  FOREIGN KEY (dataset_id) REFERENCES scrape_datasets(id) ON DELETE CASCADE
);

-- Scrape Exports Table
CREATE TABLE IF NOT EXISTS scrape_exports (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  content LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_id (job_id),
  INDEX idx_name (name),
  FOREIGN KEY (job_id) REFERENCES scrape_jobs(id) ON DELETE CASCADE
);

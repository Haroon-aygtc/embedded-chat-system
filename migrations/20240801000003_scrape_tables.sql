-- Create scrape_jobs table
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id VARCHAR(36) PRIMARY KEY,
  url TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('in-progress', 'completed', 'failed') NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  data JSON,
  metadata JSON,
  ai_analysis JSON,
  error TEXT,
  export_path VARCHAR(255),
  vector_store_url VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create scrape_vectors table
CREATE TABLE IF NOT EXISTS scrape_vectors (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  metadata JSON,
  embedding JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES scrape_jobs(id) ON DELETE CASCADE
);

-- Create scrape_exports table
CREATE TABLE IF NOT EXISTS scrape_exports (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES scrape_jobs(id) ON DELETE CASCADE
);

-- Create scrape_datasets table
CREATE TABLE IF NOT EXISTS scrape_datasets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  item_count INT NOT NULL DEFAULT 0,
  metadata JSON,
  UNIQUE (name)
);

-- Create scrape_dataset_items table
CREATE TABLE IF NOT EXISTS scrape_dataset_items (
  id VARCHAR(36) PRIMARY KEY,
  dataset_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  item_index INT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES scrape_datasets(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_timestamp ON scrape_jobs(timestamp);
CREATE INDEX idx_scrape_vectors_job_id ON scrape_vectors(job_id);
CREATE INDEX idx_scrape_exports_job_id ON scrape_exports(job_id);
CREATE INDEX idx_scrape_exports_name ON scrape_exports(name);
CREATE INDEX idx_scrape_dataset_items_dataset_id ON scrape_dataset_items(dataset_id);
CREATE INDEX idx_scrape_dataset_items_item_index ON scrape_dataset_items(item_index);

-- Add realtime publication for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE scrape_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE scrape_vectors;
ALTER PUBLICATION supabase_realtime ADD TABLE scrape_exports;
ALTER PUBLICATION supabase_realtime ADD TABLE scrape_datasets;
ALTER PUBLICATION supabase_realtime ADD TABLE scrape_dataset_items;

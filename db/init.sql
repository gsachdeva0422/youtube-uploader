-- Create enums
CREATE TYPE upload_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Folder configurations
CREATE TABLE folder_configurations (
    id SERIAL PRIMARY KEY,
    folder_name VARCHAR(100) NOT NULL,
    folder_path VARCHAR(500) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Successful video uploads
CREATE TABLE video_uploads (
    id SERIAL PRIMARY KEY,
    folder_config_id INTEGER REFERENCES folder_configurations(id),
    video_name VARCHAR(255) NOT NULL,
    video_path VARCHAR(500) NOT NULL,
    youtube_video_id VARCHAR(50),
    upload_started_at TIMESTAMP WITH TIME ZONE,
    upload_completed_at TIMESTAMP WITH TIME ZONE,
    status upload_status NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Failed uploads
CREATE TABLE upload_failures (
    id SERIAL PRIMARY KEY,
    folder_config_id INTEGER REFERENCES folder_configurations(id),
    video_name VARCHAR(255) NOT NULL,
    video_path VARCHAR(500) NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    status upload_status NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_folder_config_status ON folder_configurations(is_active);
CREATE INDEX idx_video_uploads_status ON video_uploads(status);
CREATE INDEX idx_upload_failures_status ON upload_failures(status);

-- Sample data for testing
INSERT INTO folder_configurations (folder_name, folder_path, cron_expression)
VALUES 
('riddles-videos', '/path/to/riddles-videos', '0 */3 * * *'),
('riddles-shorts', '/path/to/riddles-shorts', '0 */4 * * *');
-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('helpful', 'not_helpful', 'other')),
    content TEXT,
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedbacks_slug ON feedbacks(slug);
CREATE INDEX IF NOT EXISTS idx_feedbacks_ip_hash ON feedbacks(ip_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_slug_ip_hash ON feedbacks(slug, ip_hash);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('article', 'video', 'course', 'opportunity', 'event', 'scholarship')),
  category VARCHAR(100),
  url VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
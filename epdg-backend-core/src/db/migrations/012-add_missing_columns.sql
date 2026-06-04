-- Add missing column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add missing columns to intern_profiles
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS mentor_name VARCHAR(100);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS track VARCHAR(100);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS onboarding_step SMALLINT DEFAULT 1;
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE intern_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Announcements table (used in intern dashboard)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    audience VARCHAR(20) DEFAULT 'all',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

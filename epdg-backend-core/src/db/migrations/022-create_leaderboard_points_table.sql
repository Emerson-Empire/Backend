CREATE TABLE IF NOT EXISTS leaderboard_points (
  id SERIAL PRIMARY KEY,
  placement_id INTEGER NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0.00,
  badges JSONB,
  week_number INTEGER,
  year INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (placement_id, user_id, week_number, year)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_company_id ON leaderboard_points(company_id);
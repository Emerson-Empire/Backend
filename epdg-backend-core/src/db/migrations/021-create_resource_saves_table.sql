CREATE TABLE IF NOT EXISTS resource_saves (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (resource_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_saves_user_id ON resource_saves(user_id);
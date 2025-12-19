
CREATE TABLE user_game_state (
  account_id INTEGER PRIMARY KEY,
  name TEXT,
  balance INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  round INTEGER DEFAULT 1,
  safe_count INTEGER DEFAULT 0,
  random_hash TEXT,
  is_ongoing BOOLEAN DEFAULT FALSE,
  games_lost INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_score INTEGER DEFAULT 0
);

CREATE INDEX idx_user_game_state_balance ON user_game_state(balance DESC);

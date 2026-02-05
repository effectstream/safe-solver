
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
  current_score INTEGER DEFAULT 0,
  player_id TEXT
);

CREATE INDEX idx_user_game_state_balance ON user_game_state(balance DESC);

-- Game Integration API: metadata and achievements
CREATE TABLE game_info (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  score_unit TEXT NOT NULL,
  sort_order TEXT NOT NULL CHECK (sort_order IN ('ASC', 'DESC'))
);

CREATE TABLE achievements (
  order_id SERIAL PRIMARY KEY,
  id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL
);

-- Score entries for period-based leaderboards (all_time, weekly, daily)
CREATE TABLE score_entries (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  score NUMERIC NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_score_entries_account_achieved ON score_entries(account_id, achieved_at DESC);
CREATE INDEX idx_score_entries_achieved_at ON score_entries(achieved_at DESC);

-- Achievement unlocks per account (main identity)
CREATE TABLE achievement_completions (
  account_id INTEGER NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, achievement_id)
);

CREATE INDEX idx_achievement_completions_achievement ON achievement_completions(achievement_id);

-- Delegations: account (delegator) declares which wallet address they delegate to (e.g. main wallet)
CREATE TABLE delegations (
  account_id INTEGER PRIMARY KEY,
  delegate_to_address TEXT NOT NULL,
  delegated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delegations_delegate_to ON delegations(delegate_to_address);

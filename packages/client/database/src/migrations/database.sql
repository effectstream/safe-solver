
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  username TEXT,
  balance INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leaderboard (
  wallet_address TEXT PRIMARY KEY REFERENCES users(wallet_address),
  username TEXT,
  score INTEGER DEFAULT 0
);

CREATE TABLE user_game_state (
  wallet_address TEXT PRIMARY KEY REFERENCES users(wallet_address),
  round INTEGER DEFAULT 1,
  safe_count INTEGER DEFAULT 0
);



/* @name GetUser */
SELECT * FROM users WHERE wallet_address = :wallet_address!;

/* @name CreateUser */
INSERT INTO users (wallet_address, username, balance)
VALUES (:wallet_address!, :username, 0)
ON CONFLICT (wallet_address) DO NOTHING;

/* @name UpdateUserBalance */
UPDATE users SET balance = balance + :amount! WHERE wallet_address = :wallet_address!;

/* @name SetUserName */
UPDATE users SET username = :username! WHERE wallet_address = :wallet_address!;

/* @name GetLeaderboard */
SELECT * FROM leaderboard ORDER BY score DESC LIMIT :limit!;

/* @name SubmitScore */
INSERT INTO leaderboard (wallet_address, username, score)
VALUES (:wallet_address!, :username!, :score!)
ON CONFLICT (wallet_address) DO UPDATE
SET score = GREATEST(leaderboard.score, :score!),
    username = :username!;

/* @name UpsertGameState */
INSERT INTO user_game_state (wallet_address, round, safe_count)
VALUES (:wallet_address!, :round!, :safe_count!)
ON CONFLICT (wallet_address) DO UPDATE
SET round = :round!,
    safe_count = :safe_count!;

/* @name GetGameState */
SELECT round, safe_count FROM user_game_state WHERE wallet_address = :wallet_address!;

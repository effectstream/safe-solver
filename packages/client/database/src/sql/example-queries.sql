/* @name GetAccountProfile */
SELECT u.balance, u.last_login_at, COALESCE(u.name, a.primary_address) as username
FROM effectstream.accounts a
LEFT JOIN user_game_state u ON a.id = u.account_id
WHERE a.id = :account_id!;

/* @name EnsureAccountBalance */
INSERT INTO user_game_state (account_id, balance)
VALUES (:account_id!, 0)
ON CONFLICT (account_id) DO NOTHING;

/* @name SetAccountName */
INSERT INTO user_game_state (account_id, name)
VALUES (:account_id!, :name!)
ON CONFLICT (account_id) DO UPDATE
SET name = :name!;

/* @name UpdateAccountBalance */
INSERT INTO user_game_state (account_id, balance, last_login_at)
VALUES (:account_id!, :amount!, NOW())
ON CONFLICT (account_id) DO UPDATE
SET balance = user_game_state.balance + :amount!,
    last_login_at = NOW();

/* @name GetLeaderboard */
SELECT u.balance as score, COALESCE(u.name, a.primary_address) as username, a.primary_address as wallet
FROM user_game_state u
JOIN effectstream.accounts a ON u.account_id = a.id
ORDER BY u.balance DESC LIMIT :limit!;

/* @name UpsertGameState */
INSERT INTO user_game_state (account_id, round, safe_count, random_hash, is_ongoing, games_lost, games_won, current_score)
VALUES (:account_id!, :round!, :safe_count!, :random_hash!, :is_ongoing!, 0, 0, 0)
ON CONFLICT (account_id) DO UPDATE
SET round = :round!,
    safe_count = :safe_count!,
    random_hash = :random_hash!,
    is_ongoing = :is_ongoing!,
    current_score = 0;

/* @name UpdateCurrentScore */
UPDATE user_game_state
SET current_score = current_score + :amount!
WHERE account_id = :account_id!;

/* @name UpdateGameStatus */
UPDATE user_game_state
SET is_ongoing = :is_ongoing!
WHERE account_id = :account_id!;

/* @name IncrementGamesLost */
UPDATE user_game_state
SET games_lost = games_lost + 1, is_ongoing = FALSE
WHERE account_id = :account_id!;

/* @name IncrementGamesWon */
UPDATE user_game_state
SET games_won = games_won + 1, is_ongoing = FALSE
WHERE account_id = :account_id!;

/* @name AdvanceGameRound */
UPDATE user_game_state
SET round = round + 1, safe_count = :safe_count!
WHERE account_id = :account_id!;

/* @name GetGameState */
SELECT round, safe_count, random_hash, is_ongoing, current_score FROM user_game_state WHERE account_id = :account_id!;

/* @name GetAddressByAddress */
SELECT * FROM effectstream.addresses WHERE address = :address!;

/* @name GetAccountById */
SELECT * FROM effectstream.accounts WHERE id = :id!;

/* @name GetAddressesByAccountId */
SELECT * FROM effectstream.addresses WHERE account_id = :account_id!;

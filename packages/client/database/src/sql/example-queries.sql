/* @name GetAccountProfile */
SELECT u.balance, u.last_login_at, COALESCE(u.name, a.primary_address) as username
FROM effectstream.accounts a
LEFT JOIN user_game_state u ON a.id = u.account_id
WHERE a.id = :account_id!;

/* @name EnsureAccountBalance */
INSERT INTO user_game_state (account_id, balance, player_id)
VALUES (:account_id!, 0, :player_id!)
ON CONFLICT (account_id) DO NOTHING;

/* @name SetAccountName */
INSERT INTO user_game_state (account_id, name, player_id)
VALUES (:account_id!, :name!, :player_id!)
ON CONFLICT (account_id) DO UPDATE
SET name = :name!;

/* @name UpdateAccountBalance */
INSERT INTO user_game_state (account_id, balance, last_login_at, player_id)
VALUES (:account_id!, :amount!, NOW(), :player_id!)
ON CONFLICT (account_id) DO UPDATE
SET balance = user_game_state.balance + :amount!,
    last_login_at = NOW();

/* @name GetLeaderboard */
SELECT u.balance as score, COALESCE(u.name, a.primary_address) as username, a.primary_address as wallet
FROM user_game_state u
JOIN effectstream.accounts a ON u.account_id = a.id
ORDER BY u.balance DESC LIMIT :limit!;

/* @name UpsertGameState */
INSERT INTO user_game_state (account_id, round, safe_count, random_hash, is_ongoing, games_lost, games_won, current_score, player_id)
VALUES (:account_id!, :round!, :safe_count!, :random_hash!, :is_ongoing!, 0, 0, 0, :player_id!)
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

/* @name UpsertDelegation */
INSERT INTO delegations (account_id, delegate_to_address, delegated_at)
VALUES (:account_id!, :delegate_to_address!, NOW())
ON CONFLICT (account_id) DO UPDATE
SET delegate_to_address = EXCLUDED.delegate_to_address,
    delegated_at = NOW()
RETURNING account_id, delegate_to_address, delegated_at;

/* @name GetDelegationByAccountId */
SELECT account_id, delegate_to_address, delegated_at FROM delegations WHERE account_id = :account_id!;

/* @name GetGameInfo */
SELECT name, description, score_unit, sort_order FROM game_info WHERE id = 1;

/* @name GetAchievementsWithCompletedCount */
SELECT a.order_id, a.id, a.name, a.description, a.icon_url, COUNT(ac.account_id)::int AS completed_count
FROM achievements a
LEFT JOIN achievement_completions ac ON a.id = ac.achievement_id
GROUP BY a.order_id, a.id, a.name, a.description, a.icon_url
ORDER BY a.order_id ASC;

/* @name InsertScoreEntry */
INSERT INTO score_entries (account_id, score, achieved_at)
VALUES (:account_id!, :score!, COALESCE(:achieved_at, NOW()))
RETURNING id, account_id, score, achieved_at;

/* @name UnlockAchievement */
INSERT INTO achievement_completions (account_id, achievement_id, unlocked_at)
VALUES (:account_id!, :achievement_id!, COALESCE(:unlocked_at, NOW()))
ON CONFLICT (account_id, achievement_id) DO NOTHING
RETURNING account_id, achievement_id, unlocked_at;

/* @name GetLeaderboardTotalPlayers */
SELECT COUNT(*)::int AS total_players
FROM (
  SELECT account_id, MAX(score) AS best
  FROM score_entries
  WHERE achieved_at >= CASE
    WHEN :period! = 'daily' THEN date_trunc('day', NOW())
    WHEN :period! = 'weekly' THEN date_trunc('week', NOW())
    WHEN :period! = 'monthly' THEN date_trunc('month', NOW())
    ELSE '1970-01-01'::timestamptz
  END
  GROUP BY account_id
) t;

/* @name GetLeaderboardEntries */
WITH best_scores AS (
  SELECT account_id, MAX(score) AS score
  FROM score_entries
  WHERE achieved_at >= CASE
    WHEN :period! = 'daily' THEN date_trunc('day', NOW())
    WHEN :period! = 'weekly' THEN date_trunc('week', NOW())
    WHEN :period! = 'monthly' THEN date_trunc('month', NOW())
    ELSE '1970-01-01'::timestamptz
  END
  GROUP BY account_id
),
ranked AS (
  SELECT account_id, score, ROW_NUMBER() OVER (ORDER BY score DESC)::int AS rank
  FROM best_scores
)
SELECT r.rank, COALESCE(d.delegate_to_address, a.primary_address) AS address, COALESCE(u.player_id, 'user_' || r.account_id) AS player_id, u.name AS display_name, r.score,
  (SELECT COUNT(*)::int FROM achievement_completions ac WHERE ac.account_id = r.account_id) AS achievements_unlocked
FROM ranked r
JOIN effectstream.accounts a ON a.id = r.account_id
LEFT JOIN delegations d ON d.account_id = r.account_id
LEFT JOIN user_game_state u ON u.account_id = r.account_id
ORDER BY r.rank
LIMIT :limit! OFFSET :offset!;

/* @name GetIdentityResolution */
SELECT a.id AS account_id,
  COALESCE(d.delegate_to_address, a.primary_address) AS resolved_address,
  (COALESCE(d.delegate_to_address, a.primary_address) <> :address!) AS is_delegate
FROM effectstream.accounts a
LEFT JOIN delegations d ON d.account_id = a.id
WHERE a.primary_address = :address!
   OR EXISTS (SELECT 1 FROM effectstream.addresses ad WHERE ad.account_id = a.id AND ad.address = :address!);

/* @name GetUserProfileStats */
SELECT
  (SELECT COUNT(*)::int + 1 FROM (
    SELECT account_id, MAX(score) AS best FROM score_entries GROUP BY account_id
  ) t WHERE t.best > (SELECT COALESCE(MAX(score), -1) FROM score_entries WHERE account_id = :account_id!)) AS rank,
  (SELECT MAX(score) FROM score_entries WHERE account_id = :account_id!) AS score,
  (SELECT COALESCE(games_won, 0) + COALESCE(games_lost, 0) FROM user_game_state WHERE account_id = :account_id!) AS matches_played;

/* @name GetUserAchievementIds */
SELECT achievement_id FROM achievement_completions WHERE account_id = :account_id! ORDER BY unlocked_at;

/* @name UpsertGameInfo */
INSERT INTO game_info (id, name, description, score_unit, sort_order)
VALUES (1, :name!, :description!, :score_unit!, :sort_order!)
ON CONFLICT (id) DO UPDATE SET name = :name!, description = :description!, score_unit = :score_unit!, sort_order = :sort_order!;

/* @name InsertAchievement */
INSERT INTO achievements (id, name, description, icon_url)
VALUES (:id!, :name!, :description!, :icon_url!)
ON CONFLICT (id) DO UPDATE SET name = :name!, description = :description!, icon_url = :icon_url!;

/* @name GetAchievementIdsByPrefix */
SELECT id FROM achievements WHERE id LIKE :prefix! ORDER BY order_id ASC;

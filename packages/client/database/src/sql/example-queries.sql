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
WITH upsert AS (
  INSERT INTO delegations (account_id, delegate_to_address, delegated_at)
  VALUES (:account_id!, :delegate_to_address!, NOW())
  ON CONFLICT (account_id) DO UPDATE
  SET delegate_to_address = EXCLUDED.delegate_to_address,
      delegated_at = NOW()
  RETURNING account_id, delegate_to_address, delegated_at
),
updated_scores AS (
  UPDATE score_entries se
  SET delegated_to = u.delegate_to_address
  FROM upsert u
  WHERE se.account_id = u.account_id
),
updated_achievements AS (
  UPDATE achievement_completions ac
  SET delegated_to = u.delegate_to_address
  FROM upsert u
  WHERE ac.account_id = u.account_id
)
SELECT account_id, delegate_to_address, delegated_at FROM upsert;

/* @name GetDelegationByAccountId */
SELECT account_id, delegate_to_address, delegated_at FROM delegations WHERE account_id = :account_id!;

/* @name GetGameInfo */
SELECT name, description, score_unit, sort_order FROM game_info WHERE id = 1;

/* @name GetAchievementsWithCompletedCount */
SELECT ach.order_id,
       ach.id,
       ach.name,
       ach.description,
       ach.icon_url,
       COUNT(DISTINCT ac.delegated_to)::int AS completed_count
FROM achievements ach
LEFT JOIN achievement_completions ac ON ach.id = ac.achievement_id
GROUP BY ach.order_id, ach.id, ach.name, ach.description, ach.icon_url
ORDER BY ach.order_id ASC;

/* @name InsertScoreEntry */
INSERT INTO score_entries (account_id, delegated_to, score, achieved_at)
SELECT
  :account_id! AS account_id,
  COALESCE(del.delegate_to_address, acc.primary_address) AS delegated_to,
  :score! AS score,
  COALESCE(:achieved_at, NOW()) AS achieved_at
FROM effectstream.accounts acc
LEFT JOIN delegations del ON del.account_id = acc.id
WHERE acc.id = :account_id!
RETURNING id, account_id, delegated_to, score, achieved_at;

/* @name UnlockAchievement */
INSERT INTO achievement_completions (account_id, achievement_id, delegated_to, unlocked_at)
SELECT
  :account_id! AS account_id,
  :achievement_id! AS achievement_id,
  COALESCE(del.delegate_to_address, acc.primary_address) AS delegated_to,
  COALESCE(:unlocked_at, NOW()) AS unlocked_at
FROM effectstream.accounts acc
LEFT JOIN delegations del ON del.account_id = acc.id
WHERE acc.id = :account_id!
ON CONFLICT (account_id, achievement_id) DO NOTHING
RETURNING account_id, achievement_id, delegated_to, unlocked_at;

/* @name GetLeaderboardTotalPlayers */
SELECT COUNT(*)::int AS total_players
FROM (
  -- Count unique delegated identities (main wallets) that have a score
  SELECT delegated_to, MAX(score) AS best
  FROM score_entries
  WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
    AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
  GROUP BY delegated_to
) t;

/* @name GetLeaderboardEntries */
WITH identity_accounts AS (
  -- For each delegated identity (main wallet), collect per-account total scores
  SELECT
    delegated_to,
    account_id,
    SUM(score) AS total_score
  FROM score_entries
  WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
    AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
  GROUP BY delegated_to, account_id
),
identity_sums AS (
  -- Total score per delegated identity (main wallet)
  SELECT
    delegated_to,
    SUM(total_score) AS score
  FROM identity_accounts
  GROUP BY delegated_to
),
ranked AS (
  -- Rank identities by their total score
  SELECT
    delegated_to,
    score,
    ROW_NUMBER() OVER (ORDER BY score DESC)::int AS rank
  FROM identity_sums
)
SELECT
  r.rank,
  r.delegated_to AS address,
  COALESCE(u.player_id, 'user_' || ia.account_id) AS player_id,
  u.name AS display_name,
  r.score,
  (
    SELECT COUNT(DISTINCT ac.achievement_id)::int
    FROM achievement_completions ac
    WHERE ac.delegated_to = r.delegated_to
      AND ac.unlocked_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
      AND ac.unlocked_at <= COALESCE(:end_date::timestamptz, NOW())
  ) AS achievements_unlocked
FROM ranked r
LEFT JOIN LATERAL (
  -- Choose a representative account for identity metadata (player_id, display_name)
  SELECT ia_inner.account_id
  FROM identity_accounts ia_inner
  WHERE ia_inner.delegated_to = r.delegated_to
  ORDER BY ia_inner.total_score DESC, ia_inner.account_id ASC
  LIMIT 1
) ia ON TRUE
LEFT JOIN user_game_state u ON u.account_id = ia.account_id
ORDER BY r.rank
LIMIT :limit! OFFSET :offset!;

/* @name GetIdentityResolution */
SELECT a.id AS account_id,
  COALESCE(d.delegate_to_address, a.primary_address) AS resolved_address,
  (COALESCE(d.delegate_to_address, a.primary_address) <> :address!) AS is_delegate
FROM effectstream.accounts a
LEFT JOIN delegations d ON d.account_id = a.id
WHERE a.primary_address = :address!
   OR EXISTS (
     SELECT 1
     FROM effectstream.addresses ad
     WHERE ad.account_id = a.id AND ad.address = :address!
   )
   -- Also support lookups where :address is the delegated identity
   OR COALESCE(d.delegate_to_address, a.primary_address) = :address!
LIMIT 1;

/* @name GetUserProfileStats */
WITH identity AS (
  SELECT COALESCE(del.delegate_to_address, acc.primary_address) AS delegated_to
  FROM effectstream.accounts acc
  LEFT JOIN delegations del ON del.account_id = acc.id
  WHERE acc.id = :account_id!
),
identity_best AS (
  -- Best score for this delegated identity in the window
  SELECT MAX(se.score) AS best
  FROM score_entries se, identity i
  WHERE se.delegated_to = i.delegated_to
    AND se.achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
    AND se.achieved_at <= COALESCE(:end_date::timestamptz, NOW())
),
all_best AS (
  -- Best score for all delegated identities in the window
  SELECT delegated_to, MAX(score) AS best
  FROM score_entries
  WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
    AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
  GROUP BY delegated_to
)
SELECT
  (
    SELECT COUNT(*)::int + 1
    FROM all_best ab, identity_best ib
    WHERE ab.best > COALESCE(ib.best, -1)
  ) AS rank,
  (
    SELECT best
    FROM identity_best
  ) AS score,
  (
    SELECT COALESCE(games_won, 0) + COALESCE(games_lost, 0)
    FROM user_game_state
    WHERE account_id = :account_id!
  ) AS matches_played;

/* @name GetUserAchievementIds */
WITH resolved AS (
  SELECT COALESCE(d.delegate_to_address, a.primary_address) AS delegated_to
  FROM effectstream.accounts a
  LEFT JOIN delegations d ON d.account_id = a.id
  WHERE a.id = :account_id!
)
SELECT ac.achievement_id
FROM achievement_completions ac
CROSS JOIN resolved r
WHERE ac.delegated_to = r.delegated_to
GROUP BY ac.achievement_id
ORDER BY MIN(ac.unlocked_at);

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

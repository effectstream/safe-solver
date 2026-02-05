/** Types generated for queries found in "src/sql/example-queries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

export type NumberOrString = number | string;

/** 'GetAccountProfile' parameters type */
export interface IGetAccountProfileParams {
  account_id: number;
}

/** 'GetAccountProfile' return type */
export interface IGetAccountProfileResult {
  balance: number | null;
  last_login_at: Date | null;
  username: string | null;
}

/** 'GetAccountProfile' query type */
export interface IGetAccountProfileQuery {
  params: IGetAccountProfileParams;
  result: IGetAccountProfileResult;
}

const getAccountProfileIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":176,"b":187}]}],"statement":"SELECT u.balance, u.last_login_at, COALESCE(u.name, a.primary_address) as username\nFROM effectstream.accounts a\nLEFT JOIN user_game_state u ON a.id = u.account_id\nWHERE a.id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT u.balance, u.last_login_at, COALESCE(u.name, a.primary_address) as username
 * FROM effectstream.accounts a
 * LEFT JOIN user_game_state u ON a.id = u.account_id
 * WHERE a.id = :account_id!
 * ```
 */
export const getAccountProfile = new PreparedQuery<IGetAccountProfileParams,IGetAccountProfileResult>(getAccountProfileIR);


/** 'EnsureAccountBalance' parameters type */
export interface IEnsureAccountBalanceParams {
  account_id: number;
  player_id: string;
}

/** 'EnsureAccountBalance' return type */
export type IEnsureAccountBalanceResult = void;

/** 'EnsureAccountBalance' query type */
export interface IEnsureAccountBalanceQuery {
  params: IEnsureAccountBalanceParams;
  result: IEnsureAccountBalanceResult;
}

const ensureAccountBalanceIR: any = {"usedParamSet":{"account_id":true,"player_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":80}]},{"name":"player_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":96}]}],"statement":"INSERT INTO user_game_state (account_id, balance, player_id)\nVALUES (:account_id!, 0, :player_id!)\nON CONFLICT (account_id) DO NOTHING"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, balance, player_id)
 * VALUES (:account_id!, 0, :player_id!)
 * ON CONFLICT (account_id) DO NOTHING
 * ```
 */
export const ensureAccountBalance = new PreparedQuery<IEnsureAccountBalanceParams,IEnsureAccountBalanceResult>(ensureAccountBalanceIR);


/** 'SetAccountName' parameters type */
export interface ISetAccountNameParams {
  account_id: number;
  name: string;
  player_id: string;
}

/** 'SetAccountName' return type */
export type ISetAccountNameResult = void;

/** 'SetAccountName' query type */
export interface ISetAccountNameQuery {
  params: ISetAccountNameParams;
  result: ISetAccountNameResult;
}

const setAccountNameIR: any = {"usedParamSet":{"account_id":true,"name":true,"player_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":66,"b":77}]},{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":80,"b":85},{"a":147,"b":152}]},{"name":"player_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":88,"b":98}]}],"statement":"INSERT INTO user_game_state (account_id, name, player_id)\nVALUES (:account_id!, :name!, :player_id!)\nON CONFLICT (account_id) DO UPDATE\nSET name = :name!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, name, player_id)
 * VALUES (:account_id!, :name!, :player_id!)
 * ON CONFLICT (account_id) DO UPDATE
 * SET name = :name!
 * ```
 */
export const setAccountName = new PreparedQuery<ISetAccountNameParams,ISetAccountNameResult>(setAccountNameIR);


/** 'UpdateAccountBalance' parameters type */
export interface IUpdateAccountBalanceParams {
  account_id: number;
  amount: number;
  player_id: string;
}

/** 'UpdateAccountBalance' return type */
export type IUpdateAccountBalanceResult = void;

/** 'UpdateAccountBalance' query type */
export interface IUpdateAccountBalanceQuery {
  params: IUpdateAccountBalanceParams;
  result: IUpdateAccountBalanceResult;
}

const updateAccountBalanceIR: any = {"usedParamSet":{"account_id":true,"amount":true,"player_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":84,"b":95}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":98,"b":105},{"a":203,"b":210}]},{"name":"player_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":115,"b":125}]}],"statement":"INSERT INTO user_game_state (account_id, balance, last_login_at, player_id)\nVALUES (:account_id!, :amount!, NOW(), :player_id!)\nON CONFLICT (account_id) DO UPDATE\nSET balance = user_game_state.balance + :amount!,\n    last_login_at = NOW()"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, balance, last_login_at, player_id)
 * VALUES (:account_id!, :amount!, NOW(), :player_id!)
 * ON CONFLICT (account_id) DO UPDATE
 * SET balance = user_game_state.balance + :amount!,
 *     last_login_at = NOW()
 * ```
 */
export const updateAccountBalance = new PreparedQuery<IUpdateAccountBalanceParams,IUpdateAccountBalanceResult>(updateAccountBalanceIR);


/** 'GetLeaderboard' parameters type */
export interface IGetLeaderboardParams {
  limit: NumberOrString;
}

/** 'GetLeaderboard' return type */
export interface IGetLeaderboardResult {
  score: number | null;
  username: string | null;
  wallet: string | null;
}

/** 'GetLeaderboard' query type */
export interface IGetLeaderboardQuery {
  params: IGetLeaderboardParams;
  result: IGetLeaderboardResult;
}

const getLeaderboardIR: any = {"usedParamSet":{"limit":true},"params":[{"name":"limit","required":true,"transform":{"type":"scalar"},"locs":[{"a":209,"b":215}]}],"statement":"SELECT u.balance as score, COALESCE(u.name, a.primary_address) as username, a.primary_address as wallet\nFROM user_game_state u\nJOIN effectstream.accounts a ON u.account_id = a.id\nORDER BY u.balance DESC LIMIT :limit!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT u.balance as score, COALESCE(u.name, a.primary_address) as username, a.primary_address as wallet
 * FROM user_game_state u
 * JOIN effectstream.accounts a ON u.account_id = a.id
 * ORDER BY u.balance DESC LIMIT :limit!
 * ```
 */
export const getLeaderboard = new PreparedQuery<IGetLeaderboardParams,IGetLeaderboardResult>(getLeaderboardIR);


/** 'UpsertGameState' parameters type */
export interface IUpsertGameStateParams {
  account_id: number;
  is_ongoing: boolean;
  player_id: string;
  random_hash: string;
  round: number;
  safe_count: number;
}

/** 'UpsertGameState' return type */
export type IUpsertGameStateResult = void;

/** 'UpsertGameState' query type */
export interface IUpsertGameStateQuery {
  params: IUpsertGameStateParams;
  result: IUpsertGameStateResult;
}

const upsertGameStateIR: any = {"usedParamSet":{"account_id":true,"round":true,"safe_count":true,"random_hash":true,"is_ongoing":true,"player_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":142,"b":153}]},{"name":"round","required":true,"transform":{"type":"scalar"},"locs":[{"a":156,"b":162},{"a":277,"b":283}]},{"name":"safe_count","required":true,"transform":{"type":"scalar"},"locs":[{"a":165,"b":176},{"a":303,"b":314}]},{"name":"random_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":179,"b":191},{"a":335,"b":347}]},{"name":"is_ongoing","required":true,"transform":{"type":"scalar"},"locs":[{"a":194,"b":205},{"a":367,"b":378}]},{"name":"player_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":217,"b":227}]}],"statement":"INSERT INTO user_game_state (account_id, round, safe_count, random_hash, is_ongoing, games_lost, games_won, current_score, player_id)\nVALUES (:account_id!, :round!, :safe_count!, :random_hash!, :is_ongoing!, 0, 0, 0, :player_id!)\nON CONFLICT (account_id) DO UPDATE\nSET round = :round!,\n    safe_count = :safe_count!,\n    random_hash = :random_hash!,\n    is_ongoing = :is_ongoing!,\n    current_score = 0"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, round, safe_count, random_hash, is_ongoing, games_lost, games_won, current_score, player_id)
 * VALUES (:account_id!, :round!, :safe_count!, :random_hash!, :is_ongoing!, 0, 0, 0, :player_id!)
 * ON CONFLICT (account_id) DO UPDATE
 * SET round = :round!,
 *     safe_count = :safe_count!,
 *     random_hash = :random_hash!,
 *     is_ongoing = :is_ongoing!,
 *     current_score = 0
 * ```
 */
export const upsertGameState = new PreparedQuery<IUpsertGameStateParams,IUpsertGameStateResult>(upsertGameStateIR);


/** 'UpdateCurrentScore' parameters type */
export interface IUpdateCurrentScoreParams {
  account_id: number;
  amount: number;
}

/** 'UpdateCurrentScore' return type */
export type IUpdateCurrentScoreResult = void;

/** 'UpdateCurrentScore' query type */
export interface IUpdateCurrentScoreQuery {
  params: IUpdateCurrentScoreParams;
  result: IUpdateCurrentScoreResult;
}

const updateCurrentScoreIR: any = {"usedParamSet":{"amount":true,"account_id":true},"params":[{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":66}]},{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":87,"b":98}]}],"statement":"UPDATE user_game_state\nSET current_score = current_score + :amount!\nWHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_game_state
 * SET current_score = current_score + :amount!
 * WHERE account_id = :account_id!
 * ```
 */
export const updateCurrentScore = new PreparedQuery<IUpdateCurrentScoreParams,IUpdateCurrentScoreResult>(updateCurrentScoreIR);


/** 'UpdateGameStatus' parameters type */
export interface IUpdateGameStatusParams {
  account_id: number;
  is_ongoing: boolean;
}

/** 'UpdateGameStatus' return type */
export type IUpdateGameStatusResult = void;

/** 'UpdateGameStatus' query type */
export interface IUpdateGameStatusQuery {
  params: IUpdateGameStatusParams;
  result: IUpdateGameStatusResult;
}

const updateGameStatusIR: any = {"usedParamSet":{"is_ongoing":true,"account_id":true},"params":[{"name":"is_ongoing","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":51}]},{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":83}]}],"statement":"UPDATE user_game_state\nSET is_ongoing = :is_ongoing!\nWHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_game_state
 * SET is_ongoing = :is_ongoing!
 * WHERE account_id = :account_id!
 * ```
 */
export const updateGameStatus = new PreparedQuery<IUpdateGameStatusParams,IUpdateGameStatusResult>(updateGameStatusIR);


/** 'IncrementGamesLost' parameters type */
export interface IIncrementGamesLostParams {
  account_id: number;
}

/** 'IncrementGamesLost' return type */
export type IIncrementGamesLostResult = void;

/** 'IncrementGamesLost' query type */
export interface IIncrementGamesLostQuery {
  params: IIncrementGamesLostParams;
  result: IIncrementGamesLostResult;
}

const incrementGamesLostIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":94,"b":105}]}],"statement":"UPDATE user_game_state\nSET games_lost = games_lost + 1, is_ongoing = FALSE\nWHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_game_state
 * SET games_lost = games_lost + 1, is_ongoing = FALSE
 * WHERE account_id = :account_id!
 * ```
 */
export const incrementGamesLost = new PreparedQuery<IIncrementGamesLostParams,IIncrementGamesLostResult>(incrementGamesLostIR);


/** 'IncrementGamesWon' parameters type */
export interface IIncrementGamesWonParams {
  account_id: number;
}

/** 'IncrementGamesWon' return type */
export type IIncrementGamesWonResult = void;

/** 'IncrementGamesWon' query type */
export interface IIncrementGamesWonQuery {
  params: IIncrementGamesWonParams;
  result: IIncrementGamesWonResult;
}

const incrementGamesWonIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":92,"b":103}]}],"statement":"UPDATE user_game_state\nSET games_won = games_won + 1, is_ongoing = FALSE\nWHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_game_state
 * SET games_won = games_won + 1, is_ongoing = FALSE
 * WHERE account_id = :account_id!
 * ```
 */
export const incrementGamesWon = new PreparedQuery<IIncrementGamesWonParams,IIncrementGamesWonResult>(incrementGamesWonIR);


/** 'AdvanceGameRound' parameters type */
export interface IAdvanceGameRoundParams {
  account_id: number;
  safe_count: number;
}

/** 'AdvanceGameRound' return type */
export type IAdvanceGameRoundResult = void;

/** 'AdvanceGameRound' query type */
export interface IAdvanceGameRoundQuery {
  params: IAdvanceGameRoundParams;
  result: IAdvanceGameRoundResult;
}

const advanceGameRoundIR: any = {"usedParamSet":{"safe_count":true,"account_id":true},"params":[{"name":"safe_count","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":70}]},{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":91,"b":102}]}],"statement":"UPDATE user_game_state\nSET round = round + 1, safe_count = :safe_count!\nWHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE user_game_state
 * SET round = round + 1, safe_count = :safe_count!
 * WHERE account_id = :account_id!
 * ```
 */
export const advanceGameRound = new PreparedQuery<IAdvanceGameRoundParams,IAdvanceGameRoundResult>(advanceGameRoundIR);


/** 'GetGameState' parameters type */
export interface IGetGameStateParams {
  account_id: number;
}

/** 'GetGameState' return type */
export interface IGetGameStateResult {
  current_score: number | null;
  is_ongoing: boolean | null;
  random_hash: string | null;
  round: number | null;
  safe_count: number | null;
}

/** 'GetGameState' query type */
export interface IGetGameStateQuery {
  params: IGetGameStateParams;
  result: IGetGameStateResult;
}

const getGameStateIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":105,"b":116}]}],"statement":"SELECT round, safe_count, random_hash, is_ongoing, current_score FROM user_game_state WHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT round, safe_count, random_hash, is_ongoing, current_score FROM user_game_state WHERE account_id = :account_id!
 * ```
 */
export const getGameState = new PreparedQuery<IGetGameStateParams,IGetGameStateResult>(getGameStateIR);


/** 'GetAddressByAddress' parameters type */
export interface IGetAddressByAddressParams {
  address: string;
}

/** 'GetAddressByAddress' return type */
export interface IGetAddressByAddressResult {
  account_id: number | null;
  address: string;
  address_type: number;
}

/** 'GetAddressByAddress' query type */
export interface IGetAddressByAddressQuery {
  params: IGetAddressByAddressParams;
  result: IGetAddressByAddressResult;
}

const getAddressByAddressIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":53,"b":61}]}],"statement":"SELECT * FROM effectstream.addresses WHERE address = :address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM effectstream.addresses WHERE address = :address!
 * ```
 */
export const getAddressByAddress = new PreparedQuery<IGetAddressByAddressParams,IGetAddressByAddressResult>(getAddressByAddressIR);


/** 'GetAccountById' parameters type */
export interface IGetAccountByIdParams {
  id: number;
}

/** 'GetAccountById' return type */
export interface IGetAccountByIdResult {
  id: number;
  primary_address: string | null;
}

/** 'GetAccountById' query type */
export interface IGetAccountByIdQuery {
  params: IGetAccountByIdParams;
  result: IGetAccountByIdResult;
}

const getAccountByIdIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":47,"b":50}]}],"statement":"SELECT * FROM effectstream.accounts WHERE id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM effectstream.accounts WHERE id = :id!
 * ```
 */
export const getAccountById = new PreparedQuery<IGetAccountByIdParams,IGetAccountByIdResult>(getAccountByIdIR);


/** 'GetAddressesByAccountId' parameters type */
export interface IGetAddressesByAccountIdParams {
  account_id: number;
}

/** 'GetAddressesByAccountId' return type */
export interface IGetAddressesByAccountIdResult {
  account_id: number | null;
  address: string;
  address_type: number;
}

/** 'GetAddressesByAccountId' query type */
export interface IGetAddressesByAccountIdQuery {
  params: IGetAddressesByAccountIdParams;
  result: IGetAddressesByAccountIdResult;
}

const getAddressesByAccountIdIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":56,"b":67}]}],"statement":"SELECT * FROM effectstream.addresses WHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM effectstream.addresses WHERE account_id = :account_id!
 * ```
 */
export const getAddressesByAccountId = new PreparedQuery<IGetAddressesByAccountIdParams,IGetAddressesByAccountIdResult>(getAddressesByAccountIdIR);


/** 'UpsertDelegation' parameters type */
export interface IUpsertDelegationParams {
  account_id: number;
  delegate_to_address: string;
}

/** 'UpsertDelegation' return type */
export interface IUpsertDelegationResult {
  account_id: number;
  delegate_to_address: string;
  delegated_at: Date;
}

/** 'UpsertDelegation' query type */
export interface IUpsertDelegationQuery {
  params: IUpsertDelegationParams;
  result: IUpsertDelegationResult;
}

const upsertDelegationIR: any = {"usedParamSet":{"account_id":true,"delegate_to_address":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":80,"b":91}]},{"name":"delegate_to_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":94,"b":114}]}],"statement":"INSERT INTO delegations (account_id, delegate_to_address, delegated_at)\nVALUES (:account_id!, :delegate_to_address!, NOW())\nON CONFLICT (account_id) DO UPDATE\nSET delegate_to_address = EXCLUDED.delegate_to_address,\n    delegated_at = NOW()\nRETURNING account_id, delegate_to_address, delegated_at"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO delegations (account_id, delegate_to_address, delegated_at)
 * VALUES (:account_id!, :delegate_to_address!, NOW())
 * ON CONFLICT (account_id) DO UPDATE
 * SET delegate_to_address = EXCLUDED.delegate_to_address,
 *     delegated_at = NOW()
 * RETURNING account_id, delegate_to_address, delegated_at
 * ```
 */
export const upsertDelegation = new PreparedQuery<IUpsertDelegationParams,IUpsertDelegationResult>(upsertDelegationIR);


/** 'GetDelegationByAccountId' parameters type */
export interface IGetDelegationByAccountIdParams {
  account_id: number;
}

/** 'GetDelegationByAccountId' return type */
export interface IGetDelegationByAccountIdResult {
  account_id: number;
  delegate_to_address: string;
  delegated_at: Date;
}

/** 'GetDelegationByAccountId' query type */
export interface IGetDelegationByAccountIdQuery {
  params: IGetDelegationByAccountIdParams;
  result: IGetDelegationByAccountIdResult;
}

const getDelegationByAccountIdIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":100}]}],"statement":"SELECT account_id, delegate_to_address, delegated_at FROM delegations WHERE account_id = :account_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT account_id, delegate_to_address, delegated_at FROM delegations WHERE account_id = :account_id!
 * ```
 */
export const getDelegationByAccountId = new PreparedQuery<IGetDelegationByAccountIdParams,IGetDelegationByAccountIdResult>(getDelegationByAccountIdIR);


/** 'GetGameInfo' parameters type */
export type IGetGameInfoParams = void;

/** 'GetGameInfo' return type */
export interface IGetGameInfoResult {
  description: string;
  name: string;
  score_unit: string;
  sort_order: string;
}

/** 'GetGameInfo' query type */
export interface IGetGameInfoQuery {
  params: IGetGameInfoParams;
  result: IGetGameInfoResult;
}

const getGameInfoIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT name, description, score_unit, sort_order FROM game_info WHERE id = 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT name, description, score_unit, sort_order FROM game_info WHERE id = 1
 * ```
 */
export const getGameInfo = new PreparedQuery<IGetGameInfoParams,IGetGameInfoResult>(getGameInfoIR);


/** 'GetAchievementsWithCompletedCount' parameters type */
export type IGetAchievementsWithCompletedCountParams = void;

/** 'GetAchievementsWithCompletedCount' return type */
export interface IGetAchievementsWithCompletedCountResult {
  completed_count: number | null;
  description: string;
  icon_url: string;
  id: string;
  name: string;
  order_id: number;
}

/** 'GetAchievementsWithCompletedCount' query type */
export interface IGetAchievementsWithCompletedCountQuery {
  params: IGetAchievementsWithCompletedCountParams;
  result: IGetAchievementsWithCompletedCountResult;
}

const getAchievementsWithCompletedCountIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT a.order_id, a.id, a.name, a.description, a.icon_url, COUNT(ac.account_id)::int AS completed_count\nFROM achievements a\nLEFT JOIN achievement_completions ac ON a.id = ac.achievement_id\nGROUP BY a.order_id, a.id, a.name, a.description, a.icon_url\nORDER BY a.order_id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT a.order_id, a.id, a.name, a.description, a.icon_url, COUNT(ac.account_id)::int AS completed_count
 * FROM achievements a
 * LEFT JOIN achievement_completions ac ON a.id = ac.achievement_id
 * GROUP BY a.order_id, a.id, a.name, a.description, a.icon_url
 * ORDER BY a.order_id ASC
 * ```
 */
export const getAchievementsWithCompletedCount = new PreparedQuery<IGetAchievementsWithCompletedCountParams,IGetAchievementsWithCompletedCountResult>(getAchievementsWithCompletedCountIR);


/** 'InsertScoreEntry' parameters type */
export interface IInsertScoreEntryParams {
  account_id: number;
  achieved_at?: DateOrString | null | void;
  score: NumberOrString;
}

/** 'InsertScoreEntry' return type */
export interface IInsertScoreEntryResult {
  account_id: number;
  achieved_at: Date;
  id: number;
  score: string;
}

/** 'InsertScoreEntry' query type */
export interface IInsertScoreEntryQuery {
  params: IInsertScoreEntryParams;
  result: IInsertScoreEntryResult;
}

const insertScoreEntryIR: any = {"usedParamSet":{"account_id":true,"score":true,"achieved_at":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":67,"b":78}]},{"name":"score","required":true,"transform":{"type":"scalar"},"locs":[{"a":81,"b":87}]},{"name":"achieved_at","required":false,"transform":{"type":"scalar"},"locs":[{"a":99,"b":110}]}],"statement":"INSERT INTO score_entries (account_id, score, achieved_at)\nVALUES (:account_id!, :score!, COALESCE(:achieved_at, NOW()))\nRETURNING id, account_id, score, achieved_at"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO score_entries (account_id, score, achieved_at)
 * VALUES (:account_id!, :score!, COALESCE(:achieved_at, NOW()))
 * RETURNING id, account_id, score, achieved_at
 * ```
 */
export const insertScoreEntry = new PreparedQuery<IInsertScoreEntryParams,IInsertScoreEntryResult>(insertScoreEntryIR);


/** 'UnlockAchievement' parameters type */
export interface IUnlockAchievementParams {
  account_id: number;
  achievement_id: string;
  unlocked_at?: DateOrString | null | void;
}

/** 'UnlockAchievement' return type */
export interface IUnlockAchievementResult {
  account_id: number;
  achievement_id: string;
  unlocked_at: Date;
}

/** 'UnlockAchievement' query type */
export interface IUnlockAchievementQuery {
  params: IUnlockAchievementParams;
  result: IUnlockAchievementResult;
}

const unlockAchievementIR: any = {"usedParamSet":{"account_id":true,"achievement_id":true,"unlocked_at":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":97}]},{"name":"achievement_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":100,"b":115}]},{"name":"unlocked_at","required":false,"transform":{"type":"scalar"},"locs":[{"a":127,"b":138}]}],"statement":"INSERT INTO achievement_completions (account_id, achievement_id, unlocked_at)\nVALUES (:account_id!, :achievement_id!, COALESCE(:unlocked_at, NOW()))\nON CONFLICT (account_id, achievement_id) DO NOTHING\nRETURNING account_id, achievement_id, unlocked_at"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO achievement_completions (account_id, achievement_id, unlocked_at)
 * VALUES (:account_id!, :achievement_id!, COALESCE(:unlocked_at, NOW()))
 * ON CONFLICT (account_id, achievement_id) DO NOTHING
 * RETURNING account_id, achievement_id, unlocked_at
 * ```
 */
export const unlockAchievement = new PreparedQuery<IUnlockAchievementParams,IUnlockAchievementResult>(unlockAchievementIR);


/** 'GetLeaderboardTotalPlayers' parameters type */
export interface IGetLeaderboardTotalPlayersParams {
  end_date?: DateOrString | null | void;
  start_date?: DateOrString | null | void;
}

/** 'GetLeaderboardTotalPlayers' return type */
export interface IGetLeaderboardTotalPlayersResult {
  total_players: number | null;
}

/** 'GetLeaderboardTotalPlayers' query type */
export interface IGetLeaderboardTotalPlayersQuery {
  params: IGetLeaderboardTotalPlayersParams;
  result: IGetLeaderboardTotalPlayersResult;
}

const getLeaderboardTotalPlayersIR: any = {"usedParamSet":{"start_date":true,"end_date":true},"params":[{"name":"start_date","required":false,"transform":{"type":"scalar"},"locs":[{"a":138,"b":148}]},{"name":"end_date","required":false,"transform":{"type":"scalar"},"locs":[{"a":221,"b":229}]}],"statement":"SELECT COUNT(*)::int AS total_players\nFROM (\n  SELECT account_id, MAX(score) AS best\n  FROM score_entries\n  WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')\n  AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())\n  GROUP BY account_id\n) t"};

/**
 * Query generated from SQL:
 * ```
 * SELECT COUNT(*)::int AS total_players
 * FROM (
 *   SELECT account_id, MAX(score) AS best
 *   FROM score_entries
 *   WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
 *   AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
 *   GROUP BY account_id
 * ) t
 * ```
 */
export const getLeaderboardTotalPlayers = new PreparedQuery<IGetLeaderboardTotalPlayersParams,IGetLeaderboardTotalPlayersResult>(getLeaderboardTotalPlayersIR);


/** 'GetLeaderboardEntries' parameters type */
export interface IGetLeaderboardEntriesParams {
  end_date?: DateOrString | null | void;
  limit: NumberOrString;
  offset: NumberOrString;
  start_date?: DateOrString | null | void;
}

/** 'GetLeaderboardEntries' return type */
export interface IGetLeaderboardEntriesResult {
  achievements_unlocked: number | null;
  address: string | null;
  display_name: string | null;
  player_id: string | null;
  rank: number | null;
  score: string | null;
}

/** 'GetLeaderboardEntries' query type */
export interface IGetLeaderboardEntriesQuery {
  params: IGetLeaderboardEntriesParams;
  result: IGetLeaderboardEntriesResult;
}

const getLeaderboardEntriesIR: any = {"usedParamSet":{"start_date":true,"end_date":true,"limit":true,"offset":true},"params":[{"name":"start_date","required":false,"transform":{"type":"scalar"},"locs":[{"a":116,"b":126}]},{"name":"end_date","required":false,"transform":{"type":"scalar"},"locs":[{"a":199,"b":207}]},{"name":"limit","required":true,"transform":{"type":"scalar"},"locs":[{"a":860,"b":866}]},{"name":"offset","required":true,"transform":{"type":"scalar"},"locs":[{"a":875,"b":882}]}],"statement":"WITH best_scores AS (\n  SELECT account_id, MAX(score) AS score\n  FROM score_entries\n  WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')\n  AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())\n  GROUP BY account_id\n),\nranked AS (\n  SELECT account_id, score, ROW_NUMBER() OVER (ORDER BY score DESC)::int AS rank\n  FROM best_scores\n)\nSELECT r.rank, COALESCE(d.delegate_to_address, a.primary_address) AS address, COALESCE(u.player_id, 'user_' || r.account_id) AS player_id, u.name AS display_name, r.score,\n  (SELECT COUNT(*)::int FROM achievement_completions ac WHERE ac.account_id = r.account_id) AS achievements_unlocked\nFROM ranked r\nJOIN effectstream.accounts a ON a.id = r.account_id\nLEFT JOIN delegations d ON d.account_id = r.account_id\nLEFT JOIN user_game_state u ON u.account_id = r.account_id\nORDER BY r.rank\nLIMIT :limit! OFFSET :offset!"};

/**
 * Query generated from SQL:
 * ```
 * WITH best_scores AS (
 *   SELECT account_id, MAX(score) AS score
 *   FROM score_entries
 *   WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
 *   AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
 *   GROUP BY account_id
 * ),
 * ranked AS (
 *   SELECT account_id, score, ROW_NUMBER() OVER (ORDER BY score DESC)::int AS rank
 *   FROM best_scores
 * )
 * SELECT r.rank, COALESCE(d.delegate_to_address, a.primary_address) AS address, COALESCE(u.player_id, 'user_' || r.account_id) AS player_id, u.name AS display_name, r.score,
 *   (SELECT COUNT(*)::int FROM achievement_completions ac WHERE ac.account_id = r.account_id) AS achievements_unlocked
 * FROM ranked r
 * JOIN effectstream.accounts a ON a.id = r.account_id
 * LEFT JOIN delegations d ON d.account_id = r.account_id
 * LEFT JOIN user_game_state u ON u.account_id = r.account_id
 * ORDER BY r.rank
 * LIMIT :limit! OFFSET :offset!
 * ```
 */
export const getLeaderboardEntries = new PreparedQuery<IGetLeaderboardEntriesParams,IGetLeaderboardEntriesResult>(getLeaderboardEntriesIR);


/** 'GetIdentityResolution' parameters type */
export interface IGetIdentityResolutionParams {
  address: string;
}

/** 'GetIdentityResolution' return type */
export interface IGetIdentityResolutionResult {
  account_id: number;
  is_delegate: boolean | null;
  resolved_address: string | null;
}

/** 'GetIdentityResolution' query type */
export interface IGetIdentityResolutionQuery {
  params: IGetIdentityResolutionParams;
  result: IGetIdentityResolutionResult;
}

const getIdentityResolutionIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":158,"b":166},{"a":286,"b":294},{"a":394,"b":402}]}],"statement":"SELECT a.id AS account_id,\n  COALESCE(d.delegate_to_address, a.primary_address) AS resolved_address,\n  (COALESCE(d.delegate_to_address, a.primary_address) <> :address!) AS is_delegate\nFROM effectstream.accounts a\nLEFT JOIN delegations d ON d.account_id = a.id\nWHERE a.primary_address = :address!\n   OR EXISTS (SELECT 1 FROM effectstream.addresses ad WHERE ad.account_id = a.id AND ad.address = :address!)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT a.id AS account_id,
 *   COALESCE(d.delegate_to_address, a.primary_address) AS resolved_address,
 *   (COALESCE(d.delegate_to_address, a.primary_address) <> :address!) AS is_delegate
 * FROM effectstream.accounts a
 * LEFT JOIN delegations d ON d.account_id = a.id
 * WHERE a.primary_address = :address!
 *    OR EXISTS (SELECT 1 FROM effectstream.addresses ad WHERE ad.account_id = a.id AND ad.address = :address!)
 * ```
 */
export const getIdentityResolution = new PreparedQuery<IGetIdentityResolutionParams,IGetIdentityResolutionResult>(getIdentityResolutionIR);


/** 'GetUserProfileStats' parameters type */
export interface IGetUserProfileStatsParams {
  account_id: number;
  end_date?: DateOrString | null | void;
  start_date?: DateOrString | null | void;
}

/** 'GetUserProfileStats' return type */
export interface IGetUserProfileStatsResult {
  matches_played: number | null;
  rank: number | null;
  score: string | null;
}

/** 'GetUserProfileStats' query type */
export interface IGetUserProfileStatsQuery {
  params: IGetUserProfileStatsParams;
  result: IGetUserProfileStatsResult;
}

const getUserProfileStatsIR: any = {"usedParamSet":{"start_date":true,"end_date":true,"account_id":true},"params":[{"name":"start_date","required":false,"transform":{"type":"scalar"},"locs":[{"a":141,"b":151},{"a":435,"b":445},{"a":678,"b":688}]},{"name":"end_date","required":false,"transform":{"type":"scalar"},"locs":[{"a":228,"b":236},{"a":522,"b":530},{"a":764,"b":772}]},{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":388,"b":399},{"a":632,"b":643},{"a":908,"b":919}]}],"statement":"SELECT\n  (SELECT COUNT(*)::int + 1 FROM (\n    SELECT account_id, MAX(score) AS best\n    FROM score_entries\n    WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')\n      AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())\n    GROUP BY account_id\n  ) t WHERE t.best > (\n    SELECT COALESCE(MAX(score), -1)\n    FROM score_entries\n    WHERE account_id = :account_id!\n      AND achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')\n      AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())\n  )) AS rank,\n  (SELECT MAX(score)\n   FROM score_entries\n   WHERE account_id = :account_id!\n     AND achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')\n     AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())\n  ) AS score,\n  (SELECT COALESCE(games_won, 0) + COALESCE(games_lost, 0) FROM user_game_state WHERE account_id = :account_id!) AS matches_played"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   (SELECT COUNT(*)::int + 1 FROM (
 *     SELECT account_id, MAX(score) AS best
 *     FROM score_entries
 *     WHERE achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
 *       AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
 *     GROUP BY account_id
 *   ) t WHERE t.best > (
 *     SELECT COALESCE(MAX(score), -1)
 *     FROM score_entries
 *     WHERE account_id = :account_id!
 *       AND achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
 *       AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
 *   )) AS rank,
 *   (SELECT MAX(score)
 *    FROM score_entries
 *    WHERE account_id = :account_id!
 *      AND achieved_at >= COALESCE(:start_date::timestamptz, NOW() - INTERVAL '1 year')
 *      AND achieved_at <= COALESCE(:end_date::timestamptz, NOW())
 *   ) AS score,
 *   (SELECT COALESCE(games_won, 0) + COALESCE(games_lost, 0) FROM user_game_state WHERE account_id = :account_id!) AS matches_played
 * ```
 */
export const getUserProfileStats = new PreparedQuery<IGetUserProfileStatsParams,IGetUserProfileStatsResult>(getUserProfileStatsIR);


/** 'GetUserAchievementIds' parameters type */
export interface IGetUserAchievementIdsParams {
  account_id: number;
}

/** 'GetUserAchievementIds' return type */
export interface IGetUserAchievementIdsResult {
  achievement_id: string;
}

/** 'GetUserAchievementIds' query type */
export interface IGetUserAchievementIdsQuery {
  params: IGetUserAchievementIdsParams;
  result: IGetUserAchievementIdsResult;
}

const getUserAchievementIdsIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":70,"b":81}]}],"statement":"SELECT achievement_id FROM achievement_completions WHERE account_id = :account_id! ORDER BY unlocked_at"};

/**
 * Query generated from SQL:
 * ```
 * SELECT achievement_id FROM achievement_completions WHERE account_id = :account_id! ORDER BY unlocked_at
 * ```
 */
export const getUserAchievementIds = new PreparedQuery<IGetUserAchievementIdsParams,IGetUserAchievementIdsResult>(getUserAchievementIdsIR);


/** 'UpsertGameInfo' parameters type */
export interface IUpsertGameInfoParams {
  description: string;
  name: string;
  score_unit: string;
  sort_order: string;
}

/** 'UpsertGameInfo' return type */
export type IUpsertGameInfoResult = void;

/** 'UpsertGameInfo' query type */
export interface IUpsertGameInfoQuery {
  params: IUpsertGameInfoParams;
  result: IUpsertGameInfoResult;
}

const upsertGameInfoIR: any = {"usedParamSet":{"name":true,"description":true,"score_unit":true,"sort_order":true},"params":[{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":81,"b":86},{"a":170,"b":175}]},{"name":"description","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":101},{"a":192,"b":204}]},{"name":"score_unit","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":115},{"a":220,"b":231}]},{"name":"sort_order","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":129},{"a":247,"b":258}]}],"statement":"INSERT INTO game_info (id, name, description, score_unit, sort_order)\nVALUES (1, :name!, :description!, :score_unit!, :sort_order!)\nON CONFLICT (id) DO UPDATE SET name = :name!, description = :description!, score_unit = :score_unit!, sort_order = :sort_order!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO game_info (id, name, description, score_unit, sort_order)
 * VALUES (1, :name!, :description!, :score_unit!, :sort_order!)
 * ON CONFLICT (id) DO UPDATE SET name = :name!, description = :description!, score_unit = :score_unit!, sort_order = :sort_order!
 * ```
 */
export const upsertGameInfo = new PreparedQuery<IUpsertGameInfoParams,IUpsertGameInfoResult>(upsertGameInfoIR);


/** 'InsertAchievement' parameters type */
export interface IInsertAchievementParams {
  description: string;
  icon_url: string;
  id: string;
  name: string;
}

/** 'InsertAchievement' return type */
export type IInsertAchievementResult = void;

/** 'InsertAchievement' query type */
export interface IInsertAchievementQuery {
  params: IInsertAchievementParams;
  result: IInsertAchievementResult;
}

const insertAchievementIR: any = {"usedParamSet":{"id":true,"name":true,"description":true,"icon_url":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":67,"b":70}]},{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":73,"b":78},{"a":146,"b":151}]},{"name":"description","required":true,"transform":{"type":"scalar"},"locs":[{"a":81,"b":93},{"a":168,"b":180}]},{"name":"icon_url","required":true,"transform":{"type":"scalar"},"locs":[{"a":96,"b":105},{"a":194,"b":203}]}],"statement":"INSERT INTO achievements (id, name, description, icon_url)\nVALUES (:id!, :name!, :description!, :icon_url!)\nON CONFLICT (id) DO UPDATE SET name = :name!, description = :description!, icon_url = :icon_url!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO achievements (id, name, description, icon_url)
 * VALUES (:id!, :name!, :description!, :icon_url!)
 * ON CONFLICT (id) DO UPDATE SET name = :name!, description = :description!, icon_url = :icon_url!
 * ```
 */
export const insertAchievement = new PreparedQuery<IInsertAchievementParams,IInsertAchievementResult>(insertAchievementIR);


/** 'GetAchievementIdsByPrefix' parameters type */
export interface IGetAchievementIdsByPrefixParams {
  prefix: string;
}

/** 'GetAchievementIdsByPrefix' return type */
export interface IGetAchievementIdsByPrefixResult {
  id: string;
}

/** 'GetAchievementIdsByPrefix' query type */
export interface IGetAchievementIdsByPrefixQuery {
  params: IGetAchievementIdsByPrefixParams;
  result: IGetAchievementIdsByPrefixResult;
}

const getAchievementIdsByPrefixIR: any = {"usedParamSet":{"prefix":true},"params":[{"name":"prefix","required":true,"transform":{"type":"scalar"},"locs":[{"a":42,"b":49}]}],"statement":"SELECT id FROM achievements WHERE id LIKE :prefix! ORDER BY order_id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT id FROM achievements WHERE id LIKE :prefix! ORDER BY order_id ASC
 * ```
 */
export const getAchievementIdsByPrefix = new PreparedQuery<IGetAchievementIdsByPrefixParams,IGetAchievementIdsByPrefixResult>(getAchievementIdsByPrefixIR);



/** Types generated for queries found in "src/sql/example-queries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

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
}

/** 'EnsureAccountBalance' return type */
export type IEnsureAccountBalanceResult = void;

/** 'EnsureAccountBalance' query type */
export interface IEnsureAccountBalanceQuery {
  params: IEnsureAccountBalanceParams;
  result: IEnsureAccountBalanceResult;
}

const ensureAccountBalanceIR: any = {"usedParamSet":{"account_id":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":58,"b":69}]}],"statement":"INSERT INTO user_game_state (account_id, balance)\nVALUES (:account_id!, 0)\nON CONFLICT (account_id) DO NOTHING"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, balance)
 * VALUES (:account_id!, 0)
 * ON CONFLICT (account_id) DO NOTHING
 * ```
 */
export const ensureAccountBalance = new PreparedQuery<IEnsureAccountBalanceParams,IEnsureAccountBalanceResult>(ensureAccountBalanceIR);


/** 'SetAccountName' parameters type */
export interface ISetAccountNameParams {
  account_id: number;
  name: string;
}

/** 'SetAccountName' return type */
export type ISetAccountNameResult = void;

/** 'SetAccountName' query type */
export interface ISetAccountNameQuery {
  params: ISetAccountNameParams;
  result: ISetAccountNameResult;
}

const setAccountNameIR: any = {"usedParamSet":{"account_id":true,"name":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":55,"b":66}]},{"name":"name","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":74},{"a":123,"b":128}]}],"statement":"INSERT INTO user_game_state (account_id, name)\nVALUES (:account_id!, :name!)\nON CONFLICT (account_id) DO UPDATE\nSET name = :name!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, name)
 * VALUES (:account_id!, :name!)
 * ON CONFLICT (account_id) DO UPDATE
 * SET name = :name!
 * ```
 */
export const setAccountName = new PreparedQuery<ISetAccountNameParams,ISetAccountNameResult>(setAccountNameIR);


/** 'UpdateAccountBalance' parameters type */
export interface IUpdateAccountBalanceParams {
  account_id: number;
  amount: number;
}

/** 'UpdateAccountBalance' return type */
export type IUpdateAccountBalanceResult = void;

/** 'UpdateAccountBalance' query type */
export interface IUpdateAccountBalanceQuery {
  params: IUpdateAccountBalanceParams;
  result: IUpdateAccountBalanceResult;
}

const updateAccountBalanceIR: any = {"usedParamSet":{"account_id":true,"amount":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":73,"b":84}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":87,"b":94},{"a":179,"b":186}]}],"statement":"INSERT INTO user_game_state (account_id, balance, last_login_at)\nVALUES (:account_id!, :amount!, NOW())\nON CONFLICT (account_id) DO UPDATE\nSET balance = user_game_state.balance + :amount!,\n    last_login_at = NOW()"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, balance, last_login_at)
 * VALUES (:account_id!, :amount!, NOW())
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

const upsertGameStateIR: any = {"usedParamSet":{"account_id":true,"round":true,"safe_count":true,"random_hash":true,"is_ongoing":true},"params":[{"name":"account_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":131,"b":142}]},{"name":"round","required":true,"transform":{"type":"scalar"},"locs":[{"a":145,"b":151},{"a":253,"b":259}]},{"name":"safe_count","required":true,"transform":{"type":"scalar"},"locs":[{"a":154,"b":165},{"a":279,"b":290}]},{"name":"random_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":168,"b":180},{"a":311,"b":323}]},{"name":"is_ongoing","required":true,"transform":{"type":"scalar"},"locs":[{"a":183,"b":194},{"a":343,"b":354}]}],"statement":"INSERT INTO user_game_state (account_id, round, safe_count, random_hash, is_ongoing, games_lost, games_won, current_score)\nVALUES (:account_id!, :round!, :safe_count!, :random_hash!, :is_ongoing!, 0, 0, 0)\nON CONFLICT (account_id) DO UPDATE\nSET round = :round!,\n    safe_count = :safe_count!,\n    random_hash = :random_hash!,\n    is_ongoing = :is_ongoing!,\n    current_score = 0"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (account_id, round, safe_count, random_hash, is_ongoing, games_lost, games_won, current_score)
 * VALUES (:account_id!, :round!, :safe_count!, :random_hash!, :is_ongoing!, 0, 0, 0)
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



/** Types generated for queries found in "src/sql/example-queries.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'GetUser' parameters type */
export interface IGetUserParams {
  wallet_address: string;
}

/** 'GetUser' return type */
export interface IGetUserResult {
  balance: number | null;
  last_login_at: Date | null;
  username: string | null;
  wallet_address: string;
}

/** 'GetUser' query type */
export interface IGetUserQuery {
  params: IGetUserParams;
  result: IGetUserResult;
}

const getUserIR: any = {"usedParamSet":{"wallet_address":true},"params":[{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":43,"b":58}]}],"statement":"SELECT * FROM users WHERE wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM users WHERE wallet_address = :wallet_address!
 * ```
 */
export const getUser = new PreparedQuery<IGetUserParams,IGetUserResult>(getUserIR);


/** 'CreateUser' parameters type */
export interface ICreateUserParams {
  username?: string | null | void;
  wallet_address: string;
}

/** 'CreateUser' return type */
export type ICreateUserResult = void;

/** 'CreateUser' query type */
export interface ICreateUserQuery {
  params: ICreateUserParams;
  result: ICreateUserResult;
}

const createUserIR: any = {"usedParamSet":{"wallet_address":true,"username":true},"params":[{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":77}]},{"name":"username","required":false,"transform":{"type":"scalar"},"locs":[{"a":80,"b":88}]}],"statement":"INSERT INTO users (wallet_address, username, balance)\nVALUES (:wallet_address!, :username, 0)\nON CONFLICT (wallet_address) DO NOTHING"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users (wallet_address, username, balance)
 * VALUES (:wallet_address!, :username, 0)
 * ON CONFLICT (wallet_address) DO NOTHING
 * ```
 */
export const createUser = new PreparedQuery<ICreateUserParams,ICreateUserResult>(createUserIR);


/** 'UpdateUserBalance' parameters type */
export interface IUpdateUserBalanceParams {
  amount: number;
  wallet_address: string;
}

/** 'UpdateUserBalance' return type */
export type IUpdateUserBalanceResult = void;

/** 'UpdateUserBalance' query type */
export interface IUpdateUserBalanceQuery {
  params: IUpdateUserBalanceParams;
  result: IUpdateUserBalanceResult;
}

const updateUserBalanceIR: any = {"usedParamSet":{"amount":true,"wallet_address":true},"params":[{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":37,"b":44}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":84}]}],"statement":"UPDATE users SET balance = balance + :amount! WHERE wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE users SET balance = balance + :amount! WHERE wallet_address = :wallet_address!
 * ```
 */
export const updateUserBalance = new PreparedQuery<IUpdateUserBalanceParams,IUpdateUserBalanceResult>(updateUserBalanceIR);


/** 'SetUserName' parameters type */
export interface ISetUserNameParams {
  username: string;
  wallet_address: string;
}

/** 'SetUserName' return type */
export type ISetUserNameResult = void;

/** 'SetUserName' query type */
export interface ISetUserNameQuery {
  params: ISetUserNameParams;
  result: ISetUserNameResult;
}

const setUserNameIR: any = {"usedParamSet":{"username":true,"wallet_address":true},"params":[{"name":"username","required":true,"transform":{"type":"scalar"},"locs":[{"a":28,"b":37}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":77}]}],"statement":"UPDATE users SET username = :username! WHERE wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE users SET username = :username! WHERE wallet_address = :wallet_address!
 * ```
 */
export const setUserName = new PreparedQuery<ISetUserNameParams,ISetUserNameResult>(setUserNameIR);


/** 'GetLeaderboard' parameters type */
export interface IGetLeaderboardParams {
  limit: NumberOrString;
}

/** 'GetLeaderboard' return type */
export interface IGetLeaderboardResult {
  score: number | null;
  username: string | null;
  wallet_address: string;
}

/** 'GetLeaderboard' query type */
export interface IGetLeaderboardQuery {
  params: IGetLeaderboardParams;
  result: IGetLeaderboardResult;
}

const getLeaderboardIR: any = {"usedParamSet":{"limit":true},"params":[{"name":"limit","required":true,"transform":{"type":"scalar"},"locs":[{"a":52,"b":58}]}],"statement":"SELECT * FROM leaderboard ORDER BY score DESC LIMIT :limit!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM leaderboard ORDER BY score DESC LIMIT :limit!
 * ```
 */
export const getLeaderboard = new PreparedQuery<IGetLeaderboardParams,IGetLeaderboardResult>(getLeaderboardIR);


/** 'SubmitScore' parameters type */
export interface ISubmitScoreParams {
  score: number;
  username: string;
  wallet_address: string;
}

/** 'SubmitScore' return type */
export type ISubmitScoreResult = void;

/** 'SubmitScore' query type */
export interface ISubmitScoreQuery {
  params: ISubmitScoreParams;
  result: ISubmitScoreResult;
}

const submitScoreIR: any = {"usedParamSet":{"wallet_address":true,"username":true,"score":true},"params":[{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":66,"b":81}]},{"name":"username","required":true,"transform":{"type":"scalar"},"locs":[{"a":84,"b":93},{"a":209,"b":218}]},{"name":"score","required":true,"transform":{"type":"scalar"},"locs":[{"a":96,"b":102},{"a":184,"b":190}]}],"statement":"INSERT INTO leaderboard (wallet_address, username, score)\nVALUES (:wallet_address!, :username!, :score!)\nON CONFLICT (wallet_address) DO UPDATE\nSET score = GREATEST(leaderboard.score, :score!),\n    username = :username!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO leaderboard (wallet_address, username, score)
 * VALUES (:wallet_address!, :username!, :score!)
 * ON CONFLICT (wallet_address) DO UPDATE
 * SET score = GREATEST(leaderboard.score, :score!),
 *     username = :username!
 * ```
 */
export const submitScore = new PreparedQuery<ISubmitScoreParams,ISubmitScoreResult>(submitScoreIR);


/** 'UpsertGameState' parameters type */
export interface IUpsertGameStateParams {
  round: number;
  safe_count: number;
  wallet_address: string;
}

/** 'UpsertGameState' return type */
export type IUpsertGameStateResult = void;

/** 'UpsertGameState' query type */
export interface IUpsertGameStateQuery {
  params: IUpsertGameStateParams;
  result: IUpsertGameStateResult;
}

const upsertGameStateIR: any = {"usedParamSet":{"wallet_address":true,"round":true,"safe_count":true},"params":[{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":87}]},{"name":"round","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":96},{"a":164,"b":170}]},{"name":"safe_count","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":110},{"a":190,"b":201}]}],"statement":"INSERT INTO user_game_state (wallet_address, round, safe_count)\nVALUES (:wallet_address!, :round!, :safe_count!)\nON CONFLICT (wallet_address) DO UPDATE\nSET round = :round!,\n    safe_count = :safe_count!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO user_game_state (wallet_address, round, safe_count)
 * VALUES (:wallet_address!, :round!, :safe_count!)
 * ON CONFLICT (wallet_address) DO UPDATE
 * SET round = :round!,
 *     safe_count = :safe_count!
 * ```
 */
export const upsertGameState = new PreparedQuery<IUpsertGameStateParams,IUpsertGameStateResult>(upsertGameStateIR);


/** 'GetGameState' parameters type */
export interface IGetGameStateParams {
  wallet_address: string;
}

/** 'GetGameState' return type */
export interface IGetGameStateResult {
  round: number | null;
  safe_count: number | null;
}

/** 'GetGameState' query type */
export interface IGetGameStateQuery {
  params: IGetGameStateParams;
  result: IGetGameStateResult;
}

const getGameStateIR: any = {"usedParamSet":{"wallet_address":true},"params":[{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":84}]}],"statement":"SELECT round, safe_count FROM user_game_state WHERE wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT round, safe_count FROM user_game_state WHERE wallet_address = :wallet_address!
 * ```
 */
export const getGameState = new PreparedQuery<IGetGameStateParams,IGetGameStateResult>(getGameStateIR);



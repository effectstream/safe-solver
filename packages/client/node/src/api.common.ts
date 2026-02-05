import { type Static, Type } from "@sinclair/typebox";
import { runPreparedQuery } from "@paimaexample/db";
import {
  getAddressByAddress,
  getAccountById,
  getAddressesByAccountId,
  getGameInfo,
  getAchievementsWithCompletedCount,
  getLeaderboardTotalPlayers,
  getLeaderboardEntries,
  getIdentityResolution,
  getUserProfileStats,
  getUserAchievementIds,
  getAccountProfile,
} from "@safe-solver/database";
import type {
  IGetGameInfoResult,
  IGetAchievementsWithCompletedCountResult,
  IGetLeaderboardTotalPlayersResult,
  IGetLeaderboardEntriesResult,
  IGetIdentityResolutionResult,
  IGetUserProfileStatsResult,
  IGetUserAchievementIdsResult,
  IGetAccountProfileResult,
} from "@safe-solver/database";
import type { Pool } from "pg";
import type fastify from "fastify";

const GAME_API_PREFIX = "/v1/game";

export const apiCommon = async (
  server: fastify.FastifyInstance,
  dbConn: Pool
): Promise<void> => {

  // Address Endpoint
  const AddressParamsSchema = Type.Object({
    address: Type.String(),
  });

  const AddressResponseSchema = Type.Object({
    address: Type.String(),
    address_type: Type.Number(),
    account_id: Type.Union([Type.Number(), Type.Null()]),
  });

  server.get<{
    Params: Static<typeof AddressParamsSchema>;
    Reply: Static<typeof AddressResponseSchema> | { error: string };
  }>("/api/address/:address", async (request, reply) => {
    const { address } = request.params;
    const [result] = await runPreparedQuery(
      getAddressByAddress.run({ address }, dbConn),
      "getAddressByAddress"
    );

    if (!result) {
      reply.code(404).send({ error: "Address not found" });
      return;
    }
    reply.send(result);
  });

  // Account Endpoint
  const AccountParamsSchema = Type.Object({
    id: Type.Number(),
  });

  const AccountResponseSchema = Type.Object({
    id: Type.Number(),
    primary_address: Type.Union([Type.String(), Type.Null()]),
  });

  server.get<{
    Params: Static<typeof AccountParamsSchema>;
    Reply: Static<typeof AccountResponseSchema> | { error: string };
  }>("/api/account/:id", async (request, reply) => {
    const { id } = request.params;
    const [result] = await runPreparedQuery(
      getAccountById.run({ id }, dbConn),
      "getAccountById"
    );

    if (!result) {
      reply.code(404).send({ error: "Account not found" });
      return;
    }
    reply.send(result);
  });

  // Account Addresses Endpoint
  const AccountAddressesResponseSchema = Type.Array(
    Type.Object({
      address: Type.String(),
      address_type: Type.Number(),
      account_id: Type.Union([Type.Number(), Type.Null()]),
    })
  );

  server.get<{
    Params: Static<typeof AccountParamsSchema>;
    Reply: Static<typeof AccountAddressesResponseSchema>;
  }>("/api/account/:id/addresses", async (request, reply) => {
    const { id } = request.params;
    const results = await runPreparedQuery(
      getAddressesByAccountId.run({ account_id: id }, dbConn),
      "getAddressesByAccountId"
    );
    reply.send(results);
  });

  // ---------- Game Integration API (SPEC v1) ----------

  const GameInfoAchievementSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.String(),
    icon_url: Type.String(),
    completed_count: Type.Number(),
  });

  const GameInfoResponseSchema = Type.Object({
    name: Type.String(),
    description: Type.String(),
    score_unit: Type.String(),
    sort_order: Type.Union([Type.Literal("ASC"), Type.Literal("DESC")]),
    achievements: Type.Array(GameInfoAchievementSchema),
  });

  server.get<{
    Reply: Static<typeof GameInfoResponseSchema> | { error: string };
  }>(`${GAME_API_PREFIX}/info`, async (_request, reply) => {
    const gameInfoRows = (await runPreparedQuery(
      getGameInfo.run(undefined, dbConn),
      "getGameInfo"
    )) as IGetGameInfoResult[];
    const [gameInfo] = gameInfoRows;
    if (!gameInfo) {
      reply.code(404).send({ error: "Game info not configured" });
      return;
    }
    const achievementRows = (await runPreparedQuery(
      getAchievementsWithCompletedCount.run(undefined, dbConn),
      "getAchievementsWithCompletedCount"
    )) as IGetAchievementsWithCompletedCountResult[];
    reply.send({
      name: gameInfo.name,
      description: gameInfo.description,
      score_unit: gameInfo.score_unit,
      sort_order: gameInfo.sort_order as "ASC" | "DESC",
      achievements: achievementRows.map((a: IGetAchievementsWithCompletedCountResult) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon_url: a.icon_url,
        completed_count: a.completed_count ?? 0,
      })),
    });
  });

  const LeaderboardEntrySchema = Type.Object({
    rank: Type.Number(),
    address: Type.String(),
    player_id: Type.String(),
    display_name: Type.Union([Type.String(), Type.Null()]),
    score: Type.Number(),
    achievements_unlocked: Type.Number(),
  });

  const LeaderboardV1ResponseSchema = Type.Object({
    start_date: Type.String(),
    end_date: Type.String(),
    total_players: Type.Number(),
    entries: Type.Array(LeaderboardEntrySchema),
  });

  server.get<{
    Querystring: {
      limit?: string;
      offset?: string;
      start_date?: string;
      end_date?: string;
    };
    Reply: Static<typeof LeaderboardV1ResponseSchema>;
  }>(`${GAME_API_PREFIX}/leaderboard`, async (request, reply) => {
    const { limit: rawLimit, offset: rawOffset, start_date, end_date } = request.query;
    const limit = Math.min(Math.max(1, parseInt(rawLimit ?? "50", 10) || 50), 100);
    const offset = Math.max(0, parseInt(rawOffset ?? "0", 10) || 0);

    const maybeStartDate =
      start_date && !Number.isNaN(new Date(start_date).getTime())
        ? new Date(start_date)
        : undefined;
    const maybeEndDate =
      end_date && !Number.isNaN(new Date(end_date).getTime())
        ? new Date(end_date)
        : undefined;

    const effectiveStartDate =
      maybeStartDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const effectiveEndDate = maybeEndDate ?? new Date();

    const startIso = effectiveStartDate.toISOString();
    const endIso = effectiveEndDate.toISOString();

    const totalRows = (await runPreparedQuery(
      getLeaderboardTotalPlayers.run(
        { start_date: startIso, end_date: endIso } as any,
        dbConn
      ),
      "getLeaderboardTotalPlayers"
    )) as IGetLeaderboardTotalPlayersResult[];
    const [totalRow] = totalRows;
    const entries = (await runPreparedQuery(
      getLeaderboardEntries.run(
        { start_date: startIso, end_date: endIso, limit, offset } as any,
        dbConn
      ),
      "getLeaderboardEntries"
    )) as IGetLeaderboardEntriesResult[];
    reply.send({
      start_date: startIso,
      end_date: endIso,
      total_players: totalRow?.total_players ?? 0,
      entries: entries.map((e: IGetLeaderboardEntriesResult) => ({
        rank: e.rank ?? 0,
        address: e.address ?? "",
        player_id: e.player_id ?? "",
        display_name: e.display_name ?? null,
        score: e.score != null ? Number(e.score) : 0,
        achievements_unlocked: e.achievements_unlocked ?? 0,
      })),
    });
  });

  const UserIdentitySchema = Type.Object({
    queried_address: Type.String(),
    resolved_address: Type.String(),
    is_delegate: Type.Boolean(),
    display_name: Type.Union([Type.String(), Type.Null()]),
  });

  const UserStatsSchema = Type.Object({
    rank: Type.Union([Type.Number(), Type.Null()]),
    score: Type.Number(),
    matches_played: Type.Union([Type.Number(), Type.Optional(Type.Number())]),
  });

  const UserProfileV1ResponseSchema = Type.Object({
    identity: UserIdentitySchema,
    stats: UserStatsSchema,
    achievements: Type.Array(Type.String()),
    start_date: Type.String(),
    end_date: Type.String(),
  });

  server.get<{
    Params: { address: string };
    Querystring: { start_date?: string; end_date?: string };
    Reply: Static<typeof UserProfileV1ResponseSchema> | { error: string };
  }>(`${GAME_API_PREFIX}/users/:address`, async (request, reply) => {
    const { address } = request.params;
    const { start_date, end_date } = request.query;

    const maybeStartDate =
      start_date && !Number.isNaN(new Date(start_date).getTime())
        ? new Date(start_date)
        : undefined;
    const maybeEndDate =
      end_date && !Number.isNaN(new Date(end_date).getTime())
        ? new Date(end_date)
        : undefined;

    const effectiveStartDate =
      maybeStartDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const effectiveEndDate = maybeEndDate ?? new Date();

    const startIso = effectiveStartDate.toISOString();
    const endIso = effectiveEndDate.toISOString();
    const identityRows = (await runPreparedQuery(
      getIdentityResolution.run({ address }, dbConn),
      "getIdentityResolution"
    )) as IGetIdentityResolutionResult[];
    const [identityRow] = identityRows;
    if (!identityRow) {
      reply.code(404).send({ error: "Address not found" });
      return;
    }

    const [profileRow] = (await runPreparedQuery(
      getAccountProfile.run({ account_id: identityRow.account_id }, dbConn),
      "getAccountProfile"
    )) as IGetAccountProfileResult[];

    const statsRows = (await runPreparedQuery(
      getUserProfileStats.run(
        {
          account_id: identityRow.account_id,
          start_date: startIso,
          end_date: endIso,
        } as any,
        dbConn
      ),
      "getUserProfileStats"
    )) as IGetUserProfileStatsResult[];
    const [statsRow] = statsRows;
    const achievementRows = (await runPreparedQuery(
      getUserAchievementIds.run({ account_id: identityRow.account_id }, dbConn),
      "getUserAchievementIds"
    )) as IGetUserAchievementIdsResult[];

    const score = statsRow?.score != null ? Number(statsRow.score) : 0;
    reply.send({
      identity: {
        queried_address: address,
        resolved_address: identityRow.resolved_address ?? address,
        is_delegate: identityRow.is_delegate ?? false,
        display_name: profileRow?.username ?? null,
      },
      stats: {
        rank: score > 0 && statsRow?.rank != null ? statsRow.rank : null,
        score,
        matches_played: statsRow?.matches_played ?? 0,
      },
      achievements: achievementRows.map((r: IGetUserAchievementIdsResult) => r.achievement_id),
      start_date: startIso,
      end_date: endIso,
    });
  });
};

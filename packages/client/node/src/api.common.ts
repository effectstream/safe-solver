import { type Static, Type } from "@sinclair/typebox";
import { runPreparedQuery } from "@paimaexample/db";
import {
  getAchievementsWithCompletedCount,
  getDelegatedFromAddresses,
  getGameInfo,
  getResolvedAddressByAccountId,
  getResolvedIdentityByAddress,
  getTotalUniqueMainWallets,
  getUserAchievementsByResolvedAddress,
  getUserStatsByResolvedAddress,
} from "@safe-solver/database";
import type { Pool } from "pg";
import type fastify from "fastify";

const CHANNEL_ID = "leaderboard";

export const apiCommon = async (
  server: fastify.FastifyInstance,
  dbConn: Pool
): Promise<void> => {
  await Promise.resolve();

  // ==========================================================================
  // GET /metrics — Application metadata, achievements, and channels (PRC-6)
  // ==========================================================================

  const AchievementInfoSchema = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    description: Type.String(),
    isActive: Type.Boolean(),
    iconURI: Type.Optional(Type.String()),
    percentCompleted: Type.Optional(Type.Number()),
  });

  const ChannelSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.String(),
    scoreUnit: Type.String(),
    sortOrder: Type.String(),
    type: Type.Optional(Type.String()),
  });

  const MetricsResponseSchema = Type.Object({
    name: Type.String(),
    description: Type.String(),
    achievements: Type.Array(AchievementInfoSchema),
    channels: Type.Array(ChannelSchema),
  });

  server.get<{
    Reply: Static<typeof MetricsResponseSchema>;
  }>("/metrics", async (_request, reply) => {
    const [meta] = await runPreparedQuery(
      getGameInfo.run(void 0, dbConn),
      "getGameInfo"
    );

    const achievements = await runPreparedQuery(
      getAchievementsWithCompletedCount.run(void 0, dbConn),
      "getAchievementsWithCompletedCount"
    );

    const [totalRow] = await runPreparedQuery(
      getTotalUniqueMainWallets.run(void 0, dbConn),
      "getTotalUniqueMainWallets"
    );
    const totalPlayers = totalRow?.total ?? 0;

    reply.send({
      name: meta?.name ?? "Unknown Game",
      description: meta?.description ?? "",
      achievements: achievements.map((a) => ({
        name: a.id,
        displayName: a.name,
        description: a.description,
        isActive: true,
        iconURI: a.icon_url,
        percentCompleted:
          totalPlayers > 0
            ? Math.round(
                (Number(a.completed_count ?? "0") / totalPlayers) * 10000
              ) / 100
            : 0,
      })),
      channels: [
        {
          id: CHANNEL_ID,
          name: "Leaderboard",
          description: "Total score rankings",
          scoreUnit: meta?.score_unit ?? "Points",
          sortOrder: meta?.sort_order ?? "DESC",
          type: "cumulative",
        },
      ],
    });
  });

  // ==========================================================================
  // GET /metrics/:channel — Ranked entries for a channel (PRC-6)
  // ==========================================================================

  const ChannelLeaderboardQuerySchema = Type.Object({
    startDate: Type.Optional(Type.String()),
    endDate: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    offset: Type.Optional(Type.Number()),
    minAchievements: Type.Optional(Type.Number()),
  });

  const LeaderboardEntrySchema = Type.Object({
    rank: Type.Number(),
    address: Type.String(),
    displayName: Type.Optional(Type.String()),
    score: Type.Number(),
  });

  const ChannelLeaderboardResponseSchema = Type.Object({
    channel: Type.String(),
    startDate: Type.String(),
    endDate: Type.String(),
    totalPlayers: Type.Number(),
    totalScore: Type.Number(),
    entries: Type.Array(LeaderboardEntrySchema),
  });

  server.get<{
    Params: { channel: string };
    Querystring: Static<typeof ChannelLeaderboardQuerySchema>;
    Reply:
      | Static<typeof ChannelLeaderboardResponseSchema>
      | { error: string };
  }>("/metrics/:channel", async (request, reply) => {
    const { channel } = request.params;

    if (channel === "users") {
      // Avoid clashing with /metrics/users/:address
      reply.code(404).send({ error: "Unknown channel" });
      return;
    }

    if (channel !== CHANNEL_ID) {
      reply.code(404).send({ error: `Unknown channel: ${channel}` });
      return;
    }

    const { startDate, endDate, limit, offset, minAchievements } =
      request.query;

    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    const safeLimit =
      typeof limit === "number" && limit > 0 ? Math.min(limit, 1000) : 50;
    const safeOffset = typeof offset === "number" && offset >= 0 ? offset : 0;
    const safeMinAchievements =
      typeof minAchievements === "number" && minAchievements > 0
        ? minAchievements
        : 0;

    const { rows } = await dbConn.query(
      `WITH identity_scores AS (
  SELECT delegated_to, SUM(score) AS total_score
  FROM score_entries
  WHERE achieved_at >= $1
    AND achieved_at <= $2
  GROUP BY delegated_to
),
achievement_counts AS (
  SELECT
    delegated_to AS resolved_address,
    COUNT(DISTINCT achievement_id) AS achievements_unlocked
  FROM achievement_completions
  GROUP BY delegated_to
),
display_names AS (
  SELECT
    COALESCE(d.delegate_to_address, a.primary_address) AS resolved_address,
    MIN(a.id) AS any_account_id
  FROM effectstream.accounts a
  LEFT JOIN delegations d ON d.account_id = a.id
  GROUP BY COALESCE(d.delegate_to_address, a.primary_address)
),
ranked AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY iscores.total_score DESC, iscores.delegated_to ASC) AS rank,
    iscores.delegated_to AS address,
    COALESCE(u.name, iscores.delegated_to) AS display_name,
    iscores.total_score AS score,
    COALESCE(ac.achievements_unlocked, 0) AS achievements_unlocked
  FROM identity_scores iscores
  LEFT JOIN display_names dn ON dn.resolved_address = iscores.delegated_to
  LEFT JOIN user_game_state u ON u.account_id = dn.any_account_id
  LEFT JOIN achievement_counts ac ON ac.resolved_address = iscores.delegated_to
)
SELECT
  rank,
  address,
  display_name,
  score,
  COUNT(*) OVER () AS total_players,
  SUM(score) OVER () AS total_score
FROM ranked
WHERE achievements_unlocked >= $3
ORDER BY rank
LIMIT $4 OFFSET $5`,
      [
        start.toISOString(),
        end.toISOString(),
        safeMinAchievements,
        safeLimit,
        safeOffset,
      ]
    );

    const totalPlayers =
      rows.length > 0 ? Number(rows[0].total_players ?? "0") : 0;
    const totalScore =
      rows.length > 0 ? Number(rows[0].total_score ?? "0") : 0;

    reply.send({
      channel: CHANNEL_ID,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalPlayers,
      totalScore,
      entries: rows.map(
        (r: {
          rank: string;
          address: string;
          display_name: string | null;
          score: string;
        }) => ({
          rank: Number(r.rank),
          address: r.address ?? "",
          displayName: r.display_name ?? undefined,
          score: Number(r.score ?? 0),
        })
      ),
    });
  });

  // ==========================================================================
  // GET /metrics/users/:address — User identity and per-channel stats (PRC-6)
  // ==========================================================================

  const UserMetricsParamsSchema = Type.Object({
    address: Type.String(),
  });

  const UserMetricsQuerySchema = Type.Object({
    channel: Type.Optional(
      Type.Union([Type.String(), Type.Array(Type.String())])
    ),
    startDate: Type.Optional(Type.String()),
    endDate: Type.Optional(Type.String()),
  });

  const IdentitySchema = Type.Object({
    address: Type.String(),
    delegatedFrom: Type.Array(Type.String()),
    displayName: Type.Optional(Type.String()),
  });

  const ChannelStatsSchema = Type.Object({
    startDate: Type.Optional(Type.String()),
    endDate: Type.Optional(Type.String()),
    stats: Type.Object({
      score: Type.Number(),
      rank: Type.Number(),
      matchesPlayed: Type.Optional(Type.Number()),
    }),
  });

  const UserMetricsResponseSchema = Type.Object({
    identity: IdentitySchema,
    achievements: Type.Array(Type.String()),
    channels: Type.Optional(
      Type.Record(Type.String(), ChannelStatsSchema)
    ),
  });

  server.get<{
    Params: Static<typeof UserMetricsParamsSchema>;
    Querystring: Static<typeof UserMetricsQuerySchema>;
    Reply: Static<typeof UserMetricsResponseSchema> | { error: string };
  }>("/metrics/users/:address", async (request, reply) => {
    const { address } = request.params;
    const { channel, startDate, endDate } = request.query;

    // Determine which channels to include
    const requestedChannels = channel
      ? Array.isArray(channel)
        ? channel
        : [channel]
      : [CHANNEL_ID];
    const includeLeaderboard = requestedChannels.includes(CHANNEL_ID);

    // Date range for cumulative channels
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Resolve identity
    const [identityRow] = await runPreparedQuery(
      getResolvedIdentityByAddress.run({ address }, dbConn),
      "getResolvedIdentityByAddress"
    );

    const resolvedAddress =
      identityRow?.resolved_address ??
      identityRow?.queried_address ??
      address;

    // Fetch delegatedFrom addresses and achievements in parallel
    const [delegatedFromRows, achievementsRows] = await Promise.all([
      runPreparedQuery(
        getDelegatedFromAddresses.run(
          { resolved_address: resolvedAddress },
          dbConn
        ),
        "getDelegatedFromAddresses"
      ),
      runPreparedQuery(
        getUserAchievementsByResolvedAddress.run(
          {
            resolved_address: resolvedAddress,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
          },
          dbConn
        ),
        "getUserAchievementsByResolvedAddress"
      ),
    ]);

    // Fetch stats if leaderboard channel requested
    let statsRow: {
      rank: number | null;
      score: string | null;
      matches_played: number | null;
    } | undefined;

    if (includeLeaderboard) {
      const statsRows = await runPreparedQuery(
        getUserStatsByResolvedAddress.run(
          {
            resolved_address: resolvedAddress,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
          },
          dbConn
        ),
        "getUserStatsByResolvedAddress"
      );
      statsRow = statsRows[0];
    }

    const hasIdentity = Boolean(identityRow);

    // If nothing found at all, 404
    if (
      !hasIdentity &&
      !statsRow &&
      achievementsRows.length === 0
    ) {
      reply.code(404).send({ error: "Address not found" });
      return;
    }

    // Build channels object
    const channels: Record<
      string,
      { startDate: string; endDate: string; stats: { score: number; rank: number; matchesPlayed: number } }
    > = {};

    if (includeLeaderboard) {
      channels[CHANNEL_ID] = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        stats: {
          score:
            statsRow && statsRow.score != null
              ? Number(statsRow.score)
              : 0,
          rank:
            statsRow && statsRow.rank != null
              ? Number(statsRow.rank)
              : 0,
          matchesPlayed:
            statsRow && statsRow.matches_played != null
              ? Number(statsRow.matches_played)
              : 0,
        },
      };
    }

    reply.send({
      identity: {
        address: resolvedAddress,
        delegatedFrom: delegatedFromRows
          .map((r) => r.address)
          .filter((a): a is string => a != null),
        displayName: identityRow?.display_name ?? undefined,
      },
      achievements: achievementsRows.map((a) => a.id),
      channels:
        Object.keys(channels).length > 0 ? channels : undefined,
    });
  });

  // ==========================================================================
  // Account Addresses Endpoint (delegation-aware)
  // ==========================================================================

  const AccountParamsSchema = Type.Object({
    id: Type.Number(),
  });

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
    const [resolved] = await runPreparedQuery(
      getResolvedAddressByAccountId.run({ account_id: id }, dbConn),
      "getResolvedAddressByAccountId"
    );
    if (!resolved?.resolved_address) {
      reply.send([]);
      return;
    }
    reply.send([
      { address: resolved.resolved_address, address_type: 0, account_id: id },
    ]);
  });
};

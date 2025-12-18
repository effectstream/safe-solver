import { type Static, Type } from "@sinclair/typebox";
import { runPreparedQuery } from "@paimaexample/db";
import {
  getUser,
  getLeaderboard,
} from "@safe-solver/database";
import type { Pool } from "pg";
import type { StartConfigApiRouter } from "@paimaexample/runtime";
import type fastify from "fastify";

/**
 * Example for User Defined API Routes.
 * Register custom endpoints here.
 * @param server - The Fastify instance.
 * @param dbConn - The database connection.
 */
export const apiRouter: StartConfigApiRouter = async function (
  server: fastify.FastifyInstance,
  dbConn: Pool,
): Promise<void> {
  await Promise.resolve();
  // Definition of API Inputs and Outputs.
  // These definition build the OpenAPI documentation.
  // And allow to have type safety for the API Endpoints.
  const ParamsSchema = Type.Object({
    chain: Type.String(),
  });
  const ResponseSchema = Type.Array(Type.Object({
    action: Type.String(),
    block_height: Type.Number(),
    chain: Type.String(),
    data: Type.String(),
    id: Type.Number(),
  }));

  // Leaderboard Endpoint
  const LeaderboardResponseSchema = Type.Array(Type.Object({
    name: Type.String(),
    score: Type.Number(),
  }));

  server.get<{
    Reply: Static<typeof LeaderboardResponseSchema>;
  }>("/api/leaderboard", async (request, reply) => {
    const leaderboardData = await runPreparedQuery(
      getLeaderboard.run({ limit: 10 }, dbConn),
      "getLeaderboard"
    );
    const leaderboard = leaderboardData.map((row) => ({
      name: row.username || "Anonymous",
      score: row.score ?? 0,
    }));
    reply.send(leaderboard);
  });

  // User Profile Endpoint
  const UserProfileParamsSchema = Type.Object({
    walletAddress: Type.String(),
  });

  const UserProfileResponseSchema = Type.Object({
    balance: Type.Number(),
    lastLogin: Type.Number(),
    name: Type.Optional(Type.String()),
  });

  server.get<{
    Params: Static<typeof UserProfileParamsSchema>;
    Reply: Static<typeof UserProfileResponseSchema>;
  }>("/api/user/:walletAddress", async (request, reply) => {
    const { walletAddress } = request.params;

    const [user] = await runPreparedQuery(
      getUser.run({ wallet_address: walletAddress }, dbConn),
      "getUser"
    );

    if (!user) {
      reply.send({
        balance: 0,
        lastLogin: Date.now(),
        name: "New User",
      });
      return;
    }

    reply.send({
      balance: user.balance ?? 0,
      lastLogin: user.last_login_at ? new Date(user.last_login_at).getTime() : Date.now(),
      name: user.username || undefined,
    });
  });

};

import { type Static, Type } from "@sinclair/typebox";
import { runPreparedQuery } from "@paimaexample/db";
import {
  getAccountProfile,
  getLeaderboard,
  getAddressByAddress,
  getAccountById,
  getAddressesByAccountId,
  getGameState
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
    const leaderboard = leaderboardData.map((row) => {
      let displayName = row.username;
      if ((!displayName || displayName === row.wallet) && row.wallet) {
        const w = row.wallet;
        displayName = w.length > 10 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
      }
      return {
        name: displayName || "Anonymous",
        score: row.score ?? 0,
      };
    });
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

    // Resolve address to account
    const [addressInfo] = await runPreparedQuery(
      getAddressByAddress.run({ address: walletAddress }, dbConn),
      "getAddressByAddress"
    );

    if (!addressInfo || !addressInfo.account_id) {
       // New user or no account yet
       reply.send({
        balance: 0,
        lastLogin: Date.now(),
        name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      });
      return;
    }

    const [profile] = await runPreparedQuery(
      getAccountProfile.run({ account_id: addressInfo.account_id }, dbConn),
      "getAccountProfile"
    );

    if (!profile) {
      reply.send({
        balance: 0,
        lastLogin: Date.now(),
        name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      });
      return;
    }

    let name = profile.username;
    if (name === walletAddress) {
      name = name.length > 10 ? `${name.slice(0, 6)}...${name.slice(-4)}` : name;
    }

    reply.send({
      balance: profile.balance ?? 0,
      lastLogin: profile.last_login_at ? new Date(profile.last_login_at).getTime() : Date.now(),
      name: name || undefined,
    });
  });

  // Game State Endpoint
  const GameStateResponseSchema = Type.Object({
    round: Type.Number(),
    safe_count: Type.Number(),
    is_ongoing: Type.Boolean(),
    random_hash: Type.Union([Type.String(), Type.Null()]),
    current_score: Type.Number(),
  });

  server.get<{
    Params: Static<typeof UserProfileParamsSchema>;
    Reply: Static<typeof GameStateResponseSchema> | { error: string };
  }>("/api/gamestate/:walletAddress", async (request, reply) => {
    const { walletAddress } = request.params;

    // Resolve address to account
    const [addressInfo] = await runPreparedQuery(
      getAddressByAddress.run({ address: walletAddress }, dbConn),
      "getAddressByAddress"
    );

    if (!addressInfo || !addressInfo.account_id) {
      reply.code(404).send({ error: "Account not found" });
      return;
    }

    const [gameState] = await runPreparedQuery(
      getGameState.run({ account_id: addressInfo.account_id }, dbConn),
      "getGameState"
    );

    if (!gameState) {
       // Default state if not started
       reply.send({
         round: 1,
         safe_count: 3,
         is_ongoing: false,
         random_hash: null,
         current_score: 0
       });
       return;
    }

    reply.send({
      round: gameState.round ?? 1,
      safe_count: gameState.safe_count ?? 3,
      is_ongoing: gameState.is_ongoing ?? false,
      random_hash: gameState.random_hash,
      current_score: gameState.current_score ?? 0
    });
  });


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
  const AccountAddressesResponseSchema = Type.Array(Type.Object({
    address: Type.String(),
    address_type: Type.Number(),
    account_id: Type.Union([Type.Number(), Type.Null()]),
  }));

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


};

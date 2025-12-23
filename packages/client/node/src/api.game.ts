import { type Static, Type } from "@sinclair/typebox";
import { runPreparedQuery } from "@paimaexample/db";
import {
  getAccountProfile,
  getAddressByAddress,
  getGameState,
} from "@safe-solver/database";
import type { Pool } from "pg";
import type fastify from "fastify";

export const apiGame = async (
  server: fastify.FastifyInstance,
  dbConn: Pool
): Promise<void> => {
  // Game State Endpoint
  const GameStateResponseSchema = Type.Object({
    round: Type.Number(),
    safe_count: Type.Number(),
    is_ongoing: Type.Boolean(),
    random_hash: Type.Union([Type.String(), Type.Null()]),
    current_score: Type.Number(),
  });

  // User Profile Endpoint
  const UserProfileParamsSchema = Type.Object({
    walletAddress: Type.String(),
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
        current_score: 0,
      });
      return;
    }

    reply.send({
      round: gameState.round ?? 1,
      safe_count: gameState.safe_count ?? 3,
      is_ongoing: gameState.is_ongoing ?? false,
      random_hash: gameState.random_hash,
      current_score: gameState.current_score ?? 0,
    });
  });

  const UserProfileResponseSchema = Type.Object({
    accountId: Type.Number(),
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
        accountId: 0,
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
        accountId: 0,
        balance: 0,
        lastLogin: Date.now(),
        name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      });
      return;
    }

    let name = profile.username;
    if (name === walletAddress) {
      name =`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }

    reply.send({
      accountId: addressInfo.account_id,
      balance: profile.balance ?? 0,
      lastLogin: profile.last_login_at
        ? new Date(profile.last_login_at).getTime()
        : Date.now(),
      name: name || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    });
  });
};

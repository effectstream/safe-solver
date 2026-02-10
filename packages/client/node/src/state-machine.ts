import { PaimaSTM } from "@paimaexample/sm";
import { grammar } from "@safe-solver/data-types/grammar";
import type { BaseStfInput } from "@paimaexample/sm";
import type { StartConfigGameStateTransitions } from "@paimaexample/runtime";
import { type SyncStateUpdateStream, World } from "@paimaexample/coroutine";
import {
  ensureAccountBalance,
  upsertGameState,
  getGameState,
  updateAccountBalance,
  updateCurrentScore,
  setAccountName,
  getAddressByAddress,
  incrementGamesLost,
  incrementGamesWon,
  advanceGameRound,
  getAccountProfile,
  insertScoreEntry,
  unlockAchievement,
  upsertDelegation,
} from "@safe-solver/database";
import type { WalletAddress, AddressType } from "@paimaexample/utils";

const stm = new PaimaSTM<typeof grammar, any>(grammar);

function calculatePrize(numSafes: number, round: number): number {
  const prizes = [0.33, 0.22, 0.16, 0.13, 0.11];
  // Safe indexing: 3 safes -> index 0
  const base = prizes[numSafes - 3] || 0.1;
  const val = base * (1 + (round - 1) * 0.55);
  return Math.floor(val * 100);
}

// const decodeToByteString = (x: { [key: string]: number }): string =>
//   Array(Object.keys(x).length)
//     .fill(0)
//     .map((_, i) => x[i])
//     .join("")
//     .trim();

function* getAccountId(address?: WalletAddress, _?: AddressType) {
  if (!address) {
    console.log(`[getAccountId] No address provided`);
    return null;
  }
  const [addrInfo] = yield* World.resolve(getAddressByAddress, { address });
  if (!addrInfo) {
    console.log(`[getAccount] No address for ${address}`);
    return null;
  }
  if (!addrInfo.account_id) {
    console.log(`[getAccountId] No account for ${address}`);
    return null;
  }

  return addrInfo.account_id;
}

stm.addStateTransition("setName", function* (data) {
  const { name } = data.parsedInput;
  if (!name || name.length < 3) {
    console.log(`[setName] No name provided`);
    return;
  }
  if (name.length > 24) {
    console.log(`[setName] Name too long: ${name}`);
    return;
  }
  const accountId = yield* getAccountId(data.signerAddress, data.signerAddressType);
  if (accountId === null) return;
  console.log(`[setName] Account ${accountId} -> ${name}`);
  yield* World.resolve(setAccountName, { 
    account_id: accountId, 
    name,
    player_id: String(accountId),
  });
});

stm.addStateTransition("delegate", function* (data) {
  const { delegateToAddress } = data.parsedInput;
  const trimmed = typeof delegateToAddress === "string" ? delegateToAddress.trim() : "";
  if (!trimmed) {
    console.log("[delegate] No delegateToAddress provided");
    return;
  }
  const accountId = yield* getAccountId(data.signerAddress, data.signerAddressType);
  if (accountId === null) return;
  console.log(`[delegate] Account ${accountId} -> delegate to ${trimmed}`);
  yield* World.resolve(upsertDelegation, {
    account_id: accountId,
    delegate_to_address: trimmed,
  });
});

stm.addStateTransition("initLevel", function* (data) {
  const accountId = yield* getAccountId(data.signerAddress, data.signerAddressType);
  if (accountId === null) return;

  // Check if game already ongoing
  const [gameState] = yield* World.resolve(getGameState, { account_id: accountId });
  
  if (gameState && gameState.is_ongoing) {
    console.log(`[initLevel] Game already ongoing for Account ${accountId}. Ignoring.`);
    return;
  }

  // Ensure user balance record exists
  yield* World.resolve(ensureAccountBalance, { 
    account_id: accountId,
    player_id: String(accountId),
  });

  // Generate random hash using provided generator
  // Assuming Prando-like interface
  const randomHash = Math.floor(data.randomGenerator.next(0, 2147483647)).toString(16) + 
                     Math.floor(data.randomGenerator.next(0, 2147483647)).toString(16);

  const safeCount = Math.floor(data.randomGenerator.next(3, 7));
  const round = 1;

  console.log(`🎉 [initLevel] Account: ${accountId}, Round: ${round}, SafeCount: ${safeCount}, Hash: ${randomHash}`);

  yield* World.resolve(upsertGameState, {
    account_id: accountId,
    round,
    safe_count: safeCount,
    random_hash: randomHash,
    is_ongoing: true,
    player_id: String(accountId),
  });
});

stm.addStateTransition("checkSafe", function* (data) {
  const { safeIndex } = data.parsedInput;
  const isSafeIndexOk = safeIndex >= 0 && safeIndex < 7;
  if (!isSafeIndexOk) {
    console.log(`[checkSafe] Invalid safe index: ${safeIndex}`);
    return;
  }

  const accountId = yield* getAccountId(data.signerAddress, data.signerAddressType);
  if (accountId === null) return;

  const [gameState] = yield* World.resolve(getGameState, { account_id: accountId });
  if (!gameState || !gameState.is_ongoing) return;

  const [accountProfile] = yield* World.resolve(getAccountProfile, { account_id: accountId });
  if (!accountProfile) return;

  // next(min, max) is [min, max). We want integer index from 0 to safeCount-1.
  // There is a chance all are good!
  // .next returns inclusive of min and max.

  const badSafeIndex = Math.floor(data.randomGenerator.next(0, gameState.safe_count!));

  // Make first safe always good, so they can play a before losing for the first time.
  const isNewAccount = !(accountProfile.balance) || accountProfile.balance < 50;
  const isBad = isNewAccount ? false : safeIndex === badSafeIndex;
  const prize = isBad ? 0 : calculatePrize(gameState.safe_count!, gameState.round!);

  console.log(`🎉 [checkSafe] Account: ${accountId}, Index: ${safeIndex}, IsBad: ${isBad}, Prize: ${prize}`);

  if (isBad) {
    // Game Over
    yield* World.resolve(incrementGamesLost, { account_id: accountId });
  } else {
    // Win safe, advance round
    yield* World.resolve(updateCurrentScore, { account_id: accountId, amount: prize });

    // Determine next level parameters. We want 3 to 7 safes.
    // next(3, 8) -> [3, 8) -> floor -> 3, 4, 5, 6, 7
    const nextSafeCount = Math.floor(data.randomGenerator.next(3, 8));
    yield* World.resolve(advanceGameRound, {
      account_id: accountId,
      safe_count: nextSafeCount,
    });
  }
});

// Achievements: Reach Level 1–10, Reach Level 15 (unlock when game is won at that level)
const levelAchievements: { minLevel: number; id: string }[] = [
  { minLevel: 1, id: "reach_level_1" },
  { minLevel: 2, id: "reach_level_2" },
  { minLevel: 3, id: "reach_level_3" },
  { minLevel: 4, id: "reach_level_4" },
  { minLevel: 5, id: "reach_level_5" },
  { minLevel: 6, id: "reach_level_6" },
  { minLevel: 7, id: "reach_level_7" },
  { minLevel: 8, id: "reach_level_8" },
  { minLevel: 9, id: "reach_level_9" },
  { minLevel: 10, id: "reach_level_10" },
  { minLevel: 15, id: "reach_level_15" },
  { minLevel: 20, id: "reach_level_20" },
  { minLevel: 25, id: "reach_level_25" },
  { minLevel: 30, id: "reach_level_30" },
  { minLevel: 35, id: "reach_level_35" },
  { minLevel: 40, id: "reach_level_40" },
  { minLevel: 45, id: "reach_level_45" },
  { minLevel: 50, id: "reach_level_50" },
];

stm.addStateTransition("submitScore", function* (data) {
  const accountId = yield* getAccountId(data.signerAddress, data.signerAddressType);
  if (accountId === null) return;

  if (data.parsedInput.accountId !== accountId) {
    console.log(`[submitScore] Account ID mismatch: ${data.parsedInput.accountId} !== ${accountId}`);
    return;
  }
  
  // Get current game score to add to global
  const [gameState] = yield* World.resolve(getGameState, { account_id: accountId });
  if (!gameState) return;

  const currentScore = gameState.current_score!;
  const level = gameState.round!;


  console.log(`🎉 [submitScore] Account: ${accountId}, Adding Score: ${currentScore}, Level: ${level}`);

  for (const { minLevel, id } of levelAchievements) {
    if (level > minLevel) {
      yield* World.resolve(unlockAchievement, { account_id: accountId, achievement_id: id });
    }
  }

  if (currentScore > 0) {
    yield* World.resolve(updateAccountBalance, { 
      account_id: accountId, 
      amount: currentScore,
      player_id: String(accountId),
    });
    // Record score for Game Integration API leaderboard (all_time / weekly / daily)
    yield* World.resolve(insertScoreEntry, {
      account_id: accountId,
      score: currentScore,
    });
  }

  // Mark game as won/finished
  yield* World.resolve(incrementGamesWon, { account_id: accountId });
});

stm.addStateTransition("event_midnight", function* (data) {
  const { payload } = data.parsedInput;
  console.log(`🎉 [MIDNIGHT] Payload:`, payload);
});


// ... rest of file (gameStateTransitions)
/**
 * This function allows you to route between different State Transition Functions
 * based on block height. In other words when a new update is pushed for your game
 * that includes new logic, this router allows your game node to cleanly maintain
 * backwards compatibility with the old history before the new update came into effect.
 * @param blockHeight - The block height to process the game state transitions for.
 * @param input - The input to process the game state transitions for.
 * @returns The result of the game state transitions.
 */
export const gameStateTransitions: StartConfigGameStateTransitions = function* (
  blockHeight: number,
  input: BaseStfInput
): SyncStateUpdateStream<void> {
  if (blockHeight >= 0) {
    yield* stm.processInput(input);
  } else {
    yield* stm.processInput(input);
  }
  return;
};

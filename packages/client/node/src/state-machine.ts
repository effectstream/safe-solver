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
  advanceGameRound
} from "@safe-solver/database";

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

stm.addStateTransition("setName", function* (data) {
  const { name } = data.parsedInput;
  const user = data.signerAddress || "";
  
  const [addrInfo] = yield* World.resolve(getAddressByAddress, { address: user });
  if (!addrInfo || !addrInfo.account_id) {
    console.log(`[setName] No account for ${user}`);
    return;
  }
  const accountId = addrInfo.account_id;

  console.log(`🎉 [setName] Account ${accountId} -> ${name}`);
  yield* World.resolve(setAccountName, { account_id: accountId, name });
});

stm.addStateTransition("initLevel", function* (data) {
  const user = data.signerAddress || "";

  const [addrInfo] = yield* World.resolve(getAddressByAddress, { address: user });
  if (!addrInfo || !addrInfo.account_id) {
    console.log(`[initLevel] No account for ${user}`);
    return;
  }
  const accountId = addrInfo.account_id;

  // Check if game already ongoing
  const results = yield* World.resolve(getGameState, { account_id: accountId });
  const gameState = (results as any)[0];
  
  if (gameState && gameState.is_ongoing) {
    console.log(`[initLevel] Game already ongoing for Account ${accountId}. Ignoring.`);
    return;
  }

  // Ensure user balance record exists
  yield* World.resolve(ensureAccountBalance, { account_id: accountId });


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
    is_ongoing: true
  });
});

stm.addStateTransition("checkSafe", function* (data) {
  const { safeIndex } = data.parsedInput;
  const user = data.signerAddress || "";

  const [addrInfo] = yield* World.resolve(getAddressByAddress, { address: user });
  if (!addrInfo || !addrInfo.account_id) {
    console.log(`[checkSafe] No account for ${user}`);
    return;
  }
  const accountId = addrInfo.account_id;

  const results = yield* World.resolve(getGameState, { account_id: accountId });
  const gameState = (results as any)[0];
  
  if (!gameState || !gameState.is_ongoing) {
    console.log(`[checkSafe] Game not ongoing for Account ${accountId}`);
    return;
  }

  // Use random generator to determine bad safe
  const safeCount = gameState.safe_count!;
  // next(min, max) is [min, max). We want integer index from 0 to safeCount-1.
  // There is a chance all are good!
  // .next returns inclusive of min and max.
  const badSafeIndex = Math.floor(data.randomGenerator.next(0, safeCount));

  const round = gameState.round ?? 1;

  const isBad = safeIndex === badSafeIndex;
  const prize = isBad ? 0 : calculatePrize(safeCount, round);

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
        safe_count: nextSafeCount 
    });
  }
});

stm.addStateTransition("submitScore", function* (data) {
  const { accountId: inputAccountId } = data.parsedInput;
  const user = data.signerAddress || "";
  console.log(`🎉 [submitScore] ${data.signerAddress} - ${data.parsedInput.accountId}`);

  const [addrInfo] = yield* World.resolve(getAddressByAddress, { address: user });
  if (!addrInfo || !addrInfo.account_id) {
    console.log(`[submitScore] No account for ${user}`);
    return;
  }
  const accountId = addrInfo.account_id;
  
  // Get current game score to add to global
  const results = yield* World.resolve(getGameState, { account_id: accountId });
  const gameState = (results as any)[0];
  const currentScore = gameState?.current_score ?? 0;

  console.log(`🎉 [submitScore] Account: ${accountId}, Adding Score: ${currentScore}`);
  
  if (currentScore > 0) {
      yield* World.resolve(updateAccountBalance, { account_id: accountId, amount: currentScore });
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

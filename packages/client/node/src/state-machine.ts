import { PaimaSTM } from "@paimaexample/sm";
import { grammar } from "@safe-solver/data-types/grammar";
import type { BaseStfInput } from "@paimaexample/sm";
import type { StartConfigGameStateTransitions } from "@paimaexample/runtime";
import { type SyncStateUpdateStream, World } from "@paimaexample/coroutine";
import {
  createUser,
  upsertGameState,
  getGameState,
  updateUserBalance,
  submitScore,
  setUserName,
} from "@safe-solver/database";

const stm = new PaimaSTM<typeof grammar, any>(grammar);

function calculatePrize(numSafes: number, round: number): number {
  const prizes = [0.33, 0.22, 0.16, 0.13, 0.11];
  // Safe indexing: 3 safes -> index 0
  const base = prizes[numSafes - 3] || 0.1;
  const val = base * (1 + (round - 1) * 0.55);
  return Math.floor(val * 100);
}

const decodeToByteString = (x: { [key: string]: number }): string =>
  Array(Object.keys(x).length)
    .fill(0)
    .map((_, i) => x[i])
    .join("")
    .trim();

stm.addStateTransition("setName", function* (data) {
  const { name } = data.parsedInput;
  const user = data.signerAddress || "";
  console.log(`🎉 [setName] ${user} -> ${name}`);
  yield* World.resolve(setUserName, { wallet_address: user, username: name });
});

stm.addStateTransition("initLevel", function* (data) {
  const { safeCount, round } = data.parsedInput;
  const user = data.signerAddress || "";

  // Ensure user exists
  yield* World.resolve(createUser, { wallet_address: user, username: null });

  // Pseudo-random bad safe
  const seed = data.blockHeight + round + user.charCodeAt(0);
  const badSafeIndex = seed % safeCount;

  console.log(`🎉 [initLevel] User: ${user}, Round: ${round}, BadSafe: ${badSafeIndex}`);

  yield* World.resolve(upsertGameState, {
    wallet_address: user,
    round,
    safe_count: safeCount,
    bad_safe_index: badSafeIndex,
  });
});

stm.addStateTransition("checkSafe", function* (data) {
  const { safeIndex } = data.parsedInput;
  const user = data.signerAddress || "";

  const results = yield* World.resolve(getGameState, { wallet_address: user });
  const gameState = (results as any)[0];
  
  if (!gameState) {
    console.log(`[checkSafe] No game state for ${user}`);
    return;
  }

  // Handle potentially null database values
  const min = 0;
  const max = 3
  const badSafeIndex = data.randomGenerator.next(min, max);

  const safeCount = gameState.safe_count ?? 3;
  const round = gameState.round ?? 1;

  const isBad = safeIndex === badSafeIndex;
  const prize = isBad ? 0 : calculatePrize(safeCount, round);

  console.log(`🎉 [checkSafe] User: ${user}, Index: ${safeIndex}, IsBad: ${isBad}, Prize: ${prize}`);

  if (!isBad) {
    yield* World.resolve(updateUserBalance, { wallet_address: user, amount: prize });
  }
});

stm.addStateTransition("submitScore", function* (data) {
  const { name, score } = data.parsedInput;
  const user = data.signerAddress || "";
  
  console.log(`🎉 [submitScore] User: ${user}, Name: ${name}, Score: ${score}`);
  
  yield* World.resolve(submitScore, { 
    wallet_address: user, 
    username: name, 
    score 
  });
});

stm.addStateTransition("addTokens", function* (data) {
  const { amount } = data.parsedInput;
  const user = data.signerAddress || "";

  console.log(`🎉 [addTokens] User: ${user}, Amount: ${amount}`);
  
  yield* World.resolve(createUser, { wallet_address: user, username: null });
  yield* World.resolve(updateUserBalance, { wallet_address: user, amount });
});

stm.addStateTransition("connectWallets", function* (data) {
  const { localWalletAddress, realWalletAddress } = data.parsedInput;
  console.log(`🎉 [connectWallets] ${localWalletAddress} <-> ${realWalletAddress}`);
  
  yield* World.resolve(createUser, { wallet_address: localWalletAddress, username: null });
  yield* World.resolve(createUser, { wallet_address: realWalletAddress, username: null });
});

// stm.addStateTransition("event_midnight_unshielded-erc20", function* (data) {
//   console.log(
//     "🎉 [MIDNIGHT:unshielded-erc20] Transaction receipt:",
//     JSON.stringify(data.parsedInput.payload)
//   );
//   yield* World.resolve(insertData, {
//     chain: "midnight",
//     action: "unshielded-erc20",
//     data: JSON.stringify(data.parsedInput.payload),
//     block_height: data.blockHeight,
//   });
// });

// stm.addStateTransition("state_effectstreaml2", function* (data) {
//   console.log(
//     "🎉 [EVM:effectstreaml2] Transaction receipt:",
//     JSON.stringify(data.parsedInput)
//   );

//   yield* World.resolve(insertData, {
//     chain: "evm",
//     action: "effectstreaml2",
//     data: JSON.stringify(data.parsedInput),
//     block_height: data.blockHeight,
//   });
// });

// stm.finalize(); // this avoids people dynamically calling stm.addStateTransition after initialization

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

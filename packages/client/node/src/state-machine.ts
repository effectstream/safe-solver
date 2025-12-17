import { PaimaSTM } from "@paimaexample/sm";
import { grammar } from "@safe-solver/data-types/grammar";
import type { BaseStfInput, BaseStfOutput } from "@paimaexample/sm";
import type { StartConfigGameStateTransitions } from "@paimaexample/runtime";
import { type SyncStateUpdateStream, World } from "@paimaexample/coroutine";
import { contractAddressesEvmMain } from "@safe-solver/evm-contracts";
import { insertData } from "@safe-solver/database";

const stm = new PaimaSTM<typeof grammar, any>(grammar);

const decodeToByteString = (x: { [key: string]: number }): string => 
  Array(Object.keys(x).length)
    .fill(0)
    .map((_,i)=>x[i])
    .join('')
    .trim();


        stm.addStateTransition("event_midnight_unshielded-erc20", function* (data) {
            console.log(
                "🎉 [MIDNIGHT:unshielded-erc20] Transaction receipt:",
                JSON.stringify(data.parsedInput.payload)
            );
            yield* World.resolve(insertData, { 
                chain: "midnight", 
                action: "unshielded-erc20", 
                data: JSON.stringify(data.parsedInput.payload), 
                block_height: data.blockHeight
            });
        });



            stm.addStateTransition("state_effectstreaml2", function* (data) {
                console.log(
                    "🎉 [EVM:effectstreaml2] Transaction receipt:",
                    JSON.stringify(data.parsedInput)
                );

                yield* World.resolve(insertData, { 
                    chain: "evm", 
                    action: "effectstreaml2", 
                    data: JSON.stringify(data.parsedInput), 
                    block_height: data.blockHeight
                });
            });
        







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


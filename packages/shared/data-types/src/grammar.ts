import type { GrammarDefinition } from "@paimaexample/concise";
import { builtinGrammars } from "@paimaexample/sm/grammar";
import { Type } from "@sinclair/typebox";

export const effectstreamL2Grammar = {
  setName: [["name", Type.String()]],
  initLevel: [
    ["safeCount", Type.Integer()],
    ["round", Type.Integer()],
  ],
  checkSafe: [["safeIndex", Type.Integer()]],
  submitScore: [
    ["name", Type.String()],
    ["score", Type.Integer()],
  ],
  addTokens: [["amount", Type.Integer()]],
  connectWallets: [
    ["localWalletAddress", Type.String()],
    ["realWalletAddress", Type.String()],
  ],
  state_effectstreaml2: [
    ["input_a", Type.Integer()],
    ["input_b", Type.Integer()],
  ],
} as const satisfies GrammarDefinition;

export const grammar = {
  ...effectstreamL2Grammar,

  "event_midnight_unshielded_erc20": builtinGrammars.midnightGeneric,
} as const satisfies GrammarDefinition;

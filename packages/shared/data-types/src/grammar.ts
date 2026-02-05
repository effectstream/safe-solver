import type { GrammarDefinition } from "@paimaexample/concise";
import { builtinGrammars } from "@paimaexample/sm/grammar";
import { Type } from "@sinclair/typebox";

export const effectstreamL2Grammar = {
  setName: [["name", Type.String()]],
  initLevel: [],
  checkSafe: [["safeIndex", Type.Integer()]],
  submitScore: [
    ["accountId", Type.Integer()],
  ],
  delegate: [["delegateToAddress", Type.String()]],
} as const satisfies GrammarDefinition;

export const grammar = {
  ...effectstreamL2Grammar,

  "event_midnight": builtinGrammars.midnightGeneric,
} as const satisfies GrammarDefinition;

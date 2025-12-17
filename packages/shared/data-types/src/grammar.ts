import type { GrammarDefinition } from "@paimaexample/concise";
import { builtinGrammars } from "@paimaexample/sm/grammar";
import { Type } from "@sinclair/typebox";

export const effectstreamL2Grammar = {
  
            state_effectstreaml2: [
                ["input_a", Type.Integer()],
                ["input_b", Type.Integer()],
            ],
        
} as const satisfies GrammarDefinition;

export const grammar = {  
  ...effectstreamL2Grammar,

  "event_midnight_unshielded-erc20": builtinGrammars.midnightGeneric,

  

  

  

  

} as const satisfies GrammarDefinition;

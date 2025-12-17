import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  mint(context: __compactRuntime.CircuitContext<T>,
       account_0: { is_left: boolean,
                    left: { bytes: Uint8Array },
                    right: { bytes: Uint8Array }
                  },
       value_0: bigint): __compactRuntime.CircuitResults<T, []>;
  name(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, string>;
  symbol(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, string>;
  decimals(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  totalSupply(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  balanceOf(context: __compactRuntime.CircuitContext<T>,
            account_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       }): __compactRuntime.CircuitResults<T, bigint>;
  transfer(context: __compactRuntime.CircuitContext<T>,
           to_0: { is_left: boolean,
                   left: { bytes: Uint8Array },
                   right: { bytes: Uint8Array }
                 },
           value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  approve(context: __compactRuntime.CircuitContext<T>,
          spender_0: { is_left: boolean,
                       left: { bytes: Uint8Array },
                       right: { bytes: Uint8Array }
                     },
          value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  allowance(context: __compactRuntime.CircuitContext<T>,
            owner_0: { is_left: boolean,
                       left: { bytes: Uint8Array },
                       right: { bytes: Uint8Array }
                     },
            spender_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       }): __compactRuntime.CircuitResults<T, bigint>;
  transferFrom(context: __compactRuntime.CircuitContext<T>,
               from_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
               to_0: { is_left: boolean,
                       left: { bytes: Uint8Array },
                       right: { bytes: Uint8Array }
                     },
               value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  mint(context: __compactRuntime.CircuitContext<T>,
       account_0: { is_left: boolean,
                    left: { bytes: Uint8Array },
                    right: { bytes: Uint8Array }
                  },
       value_0: bigint): __compactRuntime.CircuitResults<T, []>;
  name(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, string>;
  symbol(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, string>;
  decimals(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  totalSupply(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  balanceOf(context: __compactRuntime.CircuitContext<T>,
            account_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       }): __compactRuntime.CircuitResults<T, bigint>;
  transfer(context: __compactRuntime.CircuitContext<T>,
           to_0: { is_left: boolean,
                   left: { bytes: Uint8Array },
                   right: { bytes: Uint8Array }
                 },
           value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  approve(context: __compactRuntime.CircuitContext<T>,
          spender_0: { is_left: boolean,
                       left: { bytes: Uint8Array },
                       right: { bytes: Uint8Array }
                     },
          value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  allowance(context: __compactRuntime.CircuitContext<T>,
            owner_0: { is_left: boolean,
                       left: { bytes: Uint8Array },
                       right: { bytes: Uint8Array }
                     },
            spender_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       }): __compactRuntime.CircuitResults<T, bigint>;
  transferFrom(context: __compactRuntime.CircuitContext<T>,
               from_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
               to_0: { is_left: boolean,
                       left: { bytes: Uint8Array },
                       right: { bytes: Uint8Array }
                     },
               value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
}

export type Ledger = {
  readonly effectstream_action_name: bigint;
  readonly effectstream_action_target: { is_left: boolean,
                                         left: { bytes: Uint8Array },
                                         right: { bytes: Uint8Array }
                                       };
  readonly effectstream_action_target2: { is_left: boolean,
                                          left: { bytes: Uint8Array },
                                          right: { bytes: Uint8Array }
                                        };
  readonly effectstream_action_value: bigint;
  readonly effectstream_action_initiator: { is_left: boolean,
                                            left: { bytes: Uint8Array },
                                            right: { bytes: Uint8Array }
                                          };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;

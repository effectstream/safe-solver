import { DefaultBatcherInput, MidnightAdapter } from "@paimaexample/batcher";
import { readMidnightContract } from "@paimaexample/midnight-contracts/read-contract";

import * as unshielded_erc20Info from "@safe-solver/midnight-contract-unshielded-erc20";

import * as unshielded_erc20Contract from "@safe-solver/midnight-contract-unshielded-erc20/contract";
import { CryptoManager } from "@paimaexample/crypto";
// import { AccountType } from "@paimaexample/wallets";

const {
  contractInfo: contractInfo0,
  contractAddress: contractAddress0,
  zkConfigPath: zkConfigPath0,
} = readMidnightContract("unshielded-erc20", "contract-unshielded-erc20.json");
/** MIDNIGHT-READ-CONTRACT-BLOCK  */

const GENESIS_MINT_WALLET_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";
const indexer = "http://localhost:8088/api/v1/graphql";
const indexerWS = "ws://localhost:8088/api/v1/graphql/ws";
const node = "http://localhost:9944";
const proofServer = "http://localhost:6300";
const networkID = 0; // NetworkId.Undeployed,
const syncProtocolName = "parallelMidnight";

/** MIDNIGHT-READ-CONTRACT-BLOCK */
const midnightAdapterConfig0 = {
  indexer,
  indexerWS,
  node,
  proofServer,
  zkConfigPath: zkConfigPath0,
  privateStateStoreName: "private-state-unshielded_erc20Contract", // Local LevelDB store
  privateStateId: "unshielded_erc20ContractPrivateState", // On-chain contract ID (must match deploy.ts)
};

class EVMMidnightAdapter extends MidnightAdapter {
  // @ts-ignore next line mismatch super type
  override async verifySignature(input: DefaultBatcherInput): Promise<boolean> {
    const {target, address, addressType, timestamp, signature} = input;
    const cryptoManager = CryptoManager.getCryptoManager(addressType);
    const signerAddress = input.address;
    const message = `${target}:${address}:${addressType}:${timestamp}`;
    const isValid = await cryptoManager.verifySignature(signerAddress, message, signature!);
    return isValid && super.verifySignature(input);
  }
}

export const midnightAdapter_unshielded_erc20 = new EVMMidnightAdapter(
  contractAddress0,
  GENESIS_MINT_WALLET_SEED,
  midnightAdapterConfig0,
  new unshielded_erc20Contract.Contract(unshielded_erc20Info.witnesses),
  unshielded_erc20Info.witnesses,
  contractInfo0,
  networkID,
  syncProtocolName
);


export const midnightAdapters: Record<string, MidnightAdapter> = {
  "unshielded-erc20": midnightAdapter_unshielded_erc20,
};

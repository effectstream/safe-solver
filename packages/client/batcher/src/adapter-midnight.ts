import { type DefaultBatcherInput, MidnightAdapter } from "@effectstream/batcher-sdk";
import { readMidnightContract } from "@effectstream/midnight-contracts/read-contract";
import * as midnightDataContractInfo from "@safe-solver/midnight-contract-midnight-data";
import { getEnv } from "@effectstream/utils";
import * as midnightDataContract from "@safe-solver/midnight-contract-midnight-data/contract";
import { CryptoManager } from "@effectstream/crypto";
import path from "node:path";
import { midnightNetworkConfig } from "@effectstream/midnight-contracts/midnight-env";

const baseDir = path.join(import.meta.dirname ?? '', '..', '..', '..', 'shared', 'contracts', 'midnight-contracts');

const {
  contractInfo: contractInfo0,
  contractAddress: contractAddress0,
  zkConfigPath: zkConfigPath0,
} = readMidnightContract("contract-midnight-data", {
  contractFileName: "contract-midnight-data.json",
  baseDir,
  networkId: midnightNetworkConfig.id,
});

if (!contractAddress0) {
  throw new Error("Contract address not found");
}

const indexer = midnightNetworkConfig.indexer;
const indexerWS = midnightNetworkConfig.indexerWS;
const node = midnightNetworkConfig.node;
const proofServer = midnightNetworkConfig.proofServer;
const networkID = midnightNetworkConfig.id;
const syncProtocolName = "parallelMidnight";

const midnightAdapterConfig0 = {
  indexer,
  indexerWS,
  node,
  proofServer,
  zkConfigPath: zkConfigPath0,
  privateStateStoreName: "private-state-midnightDataContract",
  privateStateId: "midnightDataContractPrivateState",
  walletNetworkId: networkID,
  contractJoinTimeoutSeconds: 600,
  walletFundingTimeoutSeconds: 900,
  contractName: "contract-midnight-data",
};

class EVMMidnightAdapter extends MidnightAdapter<typeof midnightDataContract.Contract> {
  // @ts-ignore next line mismatch super type
  override async verifySignature(input: DefaultBatcherInput): Promise<boolean> {
    const { target, address, addressType, timestamp, signature } = input;
    const cryptoManager = CryptoManager.getCryptoManager(addressType);
    const signerAddress = input.address;
    const message = `${target}:${address}:${addressType}:${timestamp}`;
    const isValid = await cryptoManager.verifySignature(signerAddress, message, signature!);
    return isValid && super.verifySignature(input);
  }
}

let seeds: string[] = [];
if (midnightNetworkConfig.id === 'undeployed') {
  seeds = [midnightNetworkConfig.walletSeed];
} else {
  (getEnv("MIDNIGHT_WALLET_SEEDS") || '').split(',').forEach(seed => {
    if (seed) seeds.push(seed);
  });
  if (seeds.length === 0) {
    throw new Error("No wallet seeds found");
  }
}

export const midnightAdapter_midnight_data = new EVMMidnightAdapter(
  contractAddress0,
  seeds,
  midnightAdapterConfig0,
  midnightDataContract.Contract,
  midnightDataContractInfo.witnesses,
  contractInfo0,
  syncProtocolName
);

export const midnightAdapters: Record<string, MidnightAdapter<typeof midnightDataContract.Contract>> = {
  // @ts-ignore next line mismatch super type
  "midnight-data": midnightAdapter_midnight_data,
};

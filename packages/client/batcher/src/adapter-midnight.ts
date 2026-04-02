import { type DefaultBatcherInput, MidnightAdapter } from "@paimaexample/batcher";
import { readMidnightContract } from "@paimaexample/midnight-contracts/read-contract";
import * as midnightDataContractInfo from "@safe-solver/midnight-contract-midnight-data";
import { ENV } from "@paimaexample/utils/node-env";
import * as midnightDataContract from "@safe-solver/midnight-contract-midnight-data/contract";
import { CryptoManager } from "@paimaexample/crypto";
import { dirname, resolve } from "@std/path";
import { midnightNetworkConfig } from "@paimaexample/midnight-contracts/midnight-env";

const currentDir = dirname(new URL(import.meta.url).pathname);
const baseDir = resolve(currentDir, "..", "..", "..", "shared", "contracts", "midnight-contracts");

const {
  contractInfo: contractInfo0,
  contractAddress: contractAddress0,
  zkConfigPath: zkConfigPath0,
} = readMidnightContract(
  "contract-midnight-data",
  {
    baseDir,
    networkId: midnightNetworkConfig.id,
  },
);

if (!contractAddress0) {
  throw new Error("Contract address not found");
}
/** MIDNIGHT-READ-CONTRACT-BLOCK  */

const indexer = midnightNetworkConfig.indexer;
const indexerWS = midnightNetworkConfig.indexerWS;
const node = midnightNetworkConfig.node;
const proofServer = midnightNetworkConfig.proofServer;
const networkID = midnightNetworkConfig.id;
const syncProtocolName = "parallelMidnight";

/** MIDNIGHT-READ-CONTRACT-BLOCK */
const midnightAdapterConfig0 = {
  indexer,
  indexerWS,
  node,
  proofServer,
  zkConfigPath: zkConfigPath0,
  privateStateStoreName: "private-state-midnightDataContract", // Local LevelDB store
  privateStateId: "midnightDataContractPrivateState", // On-chain contract ID (must match deploy.ts)
  walletNetworkId: networkID,
  contractJoinTimeoutSeconds: 600, // Increase timeout to 10 minutes for private state sync
  walletFundingTimeoutSeconds: 900, // Increase wallet funding timeout to 15 minutes
  contractName: "contract-midnight-data",
};

class EVMMidnightAdapter extends MidnightAdapter<typeof midnightDataContract.Contract> {
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

let seeds: string[] = [];
if (midnightNetworkConfig.id === 'undeployed') {
  seeds = [midnightNetworkConfig.walletSeed];
} else {
  (ENV.getString("MIDNIGHT_WALLET_SEEDS") || '').split(',').forEach(seed => {
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

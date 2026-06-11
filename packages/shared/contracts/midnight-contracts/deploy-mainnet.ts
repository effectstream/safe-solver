import { Buffer } from "node:buffer";
import * as path from "node:path";
import { writeFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";

import { setNetworkId } from "npm:@midnight-ntwrk/midnight-js-network-id@4.0.2";
import { deployContract } from "npm:@midnight-ntwrk/midnight-js-contracts@4.0.2";
import type { PrivateStateId } from "npm:@midnight-ntwrk/midnight-js-types@4.0.2";
import { CompiledContract, type Witnesses, type Contract } from "npm:@midnight-ntwrk/compact-js@2.5.0";
import type { SigningKey } from "@midnight-ntwrk/ledger-v8";

import {
  buildWalletFacade,
  syncAndWaitForFunds,
  waitForDustFunds,
  registerNightForDust,
  extractInitialOwnerFromWallet,
  configureMidnightNodeProviders,
  midnightNetworkConfig,
  getInitialShieldedState,
  safeStringifyProgress,
} from "@effectstream/midnight-contracts";

import type {
  DeployConfig,
  NetworkUrls,
  WalletResult,
} from "@effectstream/midnight-contracts";

import {
  midnight_data,
  witnesses as midnightDataWitnesses,
} from "./contract-midnight-data/src/index.original.ts";

import type { NetworkId } from "npm:@midnight-ntwrk/wallet-sdk-abstractions@2.0.0";

// ============================================================================
// Helpers
// ============================================================================

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function hasManagedArtifacts(dir: string): boolean {
  try {
    return ["contract", "compiler"].every((name) => {
      const stats = statSync(path.join(dir, name));
      return stats.isDirectory();
    });
  } catch {
    return false;
  }
}

function findCompilerSubdirectory(managedDir: string): string {
  try {
    for (const entry of readdirSync(managedDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (hasManagedArtifacts(path.join(managedDir, entry.name))) {
        return entry.name;
      }
    }
  } catch {
    throw new Error(`Managed directory not found: ${managedDir}`);
  }
  if (hasManagedArtifacts(managedDir)) return "";
  throw new Error(`No compiler artifacts in: ${managedDir}`);
}

// ============================================================================
// Config
// ============================================================================

const configs: DeployConfig[] = [
  {
    contractName: "contract-midnight-data",
    contractFileName: "contract-midnight-data.json",
    contractClass: midnight_data.Contract,
    witnesses: midnightDataWitnesses,
    privateStateId: "midnightDataState",
    initialPrivateState: {},
    deployArgs: [],
    privateStateStoreName: "midnight-data-private-state",
    extractWalletAddress: true,
  },
];

const network = { ...midnightNetworkConfig };
let seed: { seed: string; mnemonic: string };
if (midnightNetworkConfig.id === "mainnet") {
  const node = getEnv("MIDNIGHT_NODE_URL") as string;
  if (!node) throw new Error("MIDNIGHT_NODE_URL is not set");
  network.node = node;
  seed = {
    seed: getEnv("MIDNIGHT_WALLET_SEED") as string,
    mnemonic: getEnv("MIDNIGHT_WALLET_MNEMONIC") as string,
  };
  if (!seed.seed && !seed.mnemonic) {
    throw new Error("MIDNIGHT_WALLET_SEED is not set");
  }
} else {
  seed = { seed: midnightNetworkConfig.walletSeed, mnemonic: "" };
}

// ============================================================================
// Deploy with dust balance awareness
// ============================================================================

async function deployWithDust(
  config: DeployConfig,
  networkUrls: typeof network,
  seedOrMnemonic: { seed: string; mnemonic: string },
): Promise<string> {
  if (!getEnv("MIDNIGHT_STORAGE_PASSWORD")) {
    throw new Error("MIDNIGHT_STORAGE_PASSWORD is not set (Use a 16 char string)");
  }

  await log.setup({
    handlers: { console: new log.ConsoleHandler("INFO") },
    loggers: { default: { level: "INFO", handlers: ["console"] } },
  });

  // Resolve network
  const { id: networkIdOverride, ...endpoints } = networkUrls ?? {};
  const resolvedNetworkUrls: Required<NetworkUrls> = {
    id: "placeholder-value",
    indexer: endpoints.indexer ?? midnightNetworkConfig.indexer,
    indexerWS: endpoints.indexerWS ?? midnightNetworkConfig.indexerWS,
    node: endpoints.node ?? midnightNetworkConfig.node,
    proofServer: endpoints.proofServer ?? midnightNetworkConfig.proofServer,
  };
  const resolvedNetworkId = (networkIdOverride ??
    midnightNetworkConfig.id) as NetworkId.NetworkId;
  resolvedNetworkUrls.id = resolvedNetworkId;

  console.log(
    `Network: ${resolvedNetworkId} | indexer=${resolvedNetworkUrls.indexer} node=${resolvedNetworkUrls.node} proof=${resolvedNetworkUrls.proofServer}`,
  );
  setNetworkId(resolvedNetworkId);

  // Find contract directory
  const contractDir = path.dirname(new URL(import.meta.url).pathname);
  const managedDir = path.join(contractDir, config.contractName, "src/managed");
  const compilerSubdir = findCompilerSubdirectory(managedDir);
  const zkConfigPath = path.resolve(path.join(managedDir, compilerSubdir));

  const privateStateStoreName =
    config.privateStateStoreName ??
    `${config.contractName.replace("contract-", "")}-private-state`;

  let walletResult: WalletResult | null = null;

  try {
    // ---- Build wallet ----
    console.log("Building wallet...");
    const walletSeed = seedOrMnemonic.seed || midnightNetworkConfig.walletSeed;
    if (!walletSeed) throw new Error("No seed provided");

    walletResult = await buildWalletFacade(
      resolvedNetworkUrls,
      walletSeed,
      resolvedNetworkId,
    );

    console.log(`Wallet seed: ${walletSeed}`);
    console.log(`Dust address: ${walletResult.dustAddress}`);
    console.log(`Unshielded address: ${walletResult.unshieldedAddress}`);

    // ---- Sync and show ALL balances ----
    console.log("Syncing wallet (shielded + unshielded + dust)...");
    const { shieldedBalance, unshieldedBalance, dustBalance } =
      await syncAndWaitForFunds(walletResult.wallet);

    console.log("==========================================");
    console.log("Wallet Balances");
    console.log("==========================================");
    console.log(`Shielded Balance:   ${shieldedBalance} NIGHT`);
    console.log(`Unshielded Balance: ${unshieldedBalance} NIGHT`);
    console.log(`Dust Balance:       ${dustBalance} DUST`);
    console.log("==========================================");

    // ---- Ensure dust is available for tx fees ----
    let currentDust = dustBalance;
    if (currentDust === 0n) {
      if (unshieldedBalance > 0n) {
        console.log("Dust is 0 but unshielded funds available. Registering Night UTXOs for dust generation...");
        const success = await registerNightForDust(walletResult);
        if (success) {
          currentDust = await waitForDustFunds(walletResult.wallet, {
            timeoutMs: 60_000,
          });
          console.log(`Dust after registration: ${currentDust} DUST`);
        } else {
          console.warn("Dust registration failed. Deployment may fail due to insufficient fees.");
        }
      } else {
        console.warn("No dust and no unshielded funds. Deployment will likely fail.");
      }
    }

    // ---- Extract wallet address if needed ----
    let deployArgs = config.deployArgs;
    if (config.extractWalletAddress && deployArgs && deployArgs.length > 0) {
      const initialOwner = await extractInitialOwnerFromWallet(
        walletResult.wallet,
      );
      deployArgs = [...deployArgs.slice(0, -1), initialOwner];
    }

    console.log("Wallet built successfully.");

    // ---- Configure providers ----
    console.log("Configuring providers...");
    const deployPrivateStateStoreName = `${privateStateStoreName}-deploy`;

    const providers = configureMidnightNodeProviders(
      walletResult.wallet,
      walletResult.zswapSecretKeys,
      walletResult.walletZswapSecretKeys,
      walletResult.dustSecretKey,
      walletResult.walletDustSecretKey,
      resolvedNetworkUrls,
      deployPrivateStateStoreName,
      zkConfigPath,
      walletResult.unshieldedKeystore,
    );
    console.log("Providers configured.");

    // ---- Deploy contract ----
    console.log("Deploying contract...");

    const MyCompiledContract = CompiledContract.make(
      config.contractName,
      config.contractClass,
    ).pipe(
      CompiledContract.withWitnesses(config.witnesses as never),
      CompiledContract.withCompiledFileAssets(managedDir),
    );

    const deployOptions: {
      compiledContract: CompiledContract.CompiledContract<
        Contract<undefined, Witnesses<undefined>>,
        undefined,
        never
      >;
      privateStateId: PrivateStateId;
      initialPrivateState: Contract.PrivateState<any>;
      signingKey?: SigningKey;
      args: Contract.InitializeParameters<any>;
    } = {
      compiledContract: MyCompiledContract as any,
      privateStateId: config.privateStateId as PrivateStateId,
      initialPrivateState: config.initialPrivateState as Contract.PrivateState<any>,
      args: (deployArgs && deployArgs.length > 0
        ? deployArgs
        : []) as Contract.InitializeParameters<any>,
      signingKey: undefined,
    };

    const deployedContract = await deployContract(
      providers,
      deployOptions as any,
    );
    console.log("Contract deployed.");

    const contractAddress =
      deployedContract.deployTxData.public.contractAddress;
    console.log(`Contract address: ${contractAddress}`);

    // Save address to network-specific file
    const baseContractFileName =
      config.contractFileName ?? `${config.contractName}.json`;
    const { dir: contractFileDir, name: contractFileBaseName, ext: contractFileExt } =
      path.parse(baseContractFileName);
    const normalizedExt = contractFileExt || ".json";
    const networkSuffix = `.${resolvedNetworkId}`;
    const fileBaseWithNetwork = contractFileBaseName.endsWith(networkSuffix)
      ? contractFileBaseName
      : `${contractFileBaseName}${networkSuffix}`;
    const outputFileName = `${fileBaseWithNetwork}${normalizedExt}`;
    const outputPath = path.join(contractDir, contractFileDir, outputFileName);

    await writeFile(outputPath, JSON.stringify({ contractAddress }, null, 2));
    console.log(`Contract address saved to ${outputPath} (network: ${resolvedNetworkId})`);

    return contractAddress;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Deployment failed: ${e.message}`);
    } else {
      console.error("An unknown error occurred during deployment.");
    }
    throw e;
  } finally {
    if (walletResult) {
      console.log("Closing wallet...");
      try {
        await walletResult.wallet.stop();
      } catch {
        // Ignore close errors
      }
      console.log("Wallet closed.");
    }
    console.log("Waiting for Level DB cleanup...");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// ============================================================================
// Main
// ============================================================================

const start = async () => {
  for (const config of configs) {
    await deployWithDust(config, network, seed);
  }
};

start()
  .then(() => {
    console.log("Deployment successful");
    process.exit(0);
  })
  .catch((e: unknown) => {
    console.error("Unhandled error:", e);
    process.exit(1);
  });

import * as log from "@std/log";
import { Buffer } from "node:buffer";
import * as path from "@std/path";
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
} from "@paimaexample/midnight-contracts";

import type {
  DeployConfig,
  NetworkUrls,
  WalletResult,
} from "@paimaexample/midnight-contracts";

import {
  midnight_data,
  witnesses as midnightDataWitnesses,
} from "./contract-midnight-data/src/index.original.ts";

import type { NetworkId } from "npm:@midnight-ntwrk/wallet-sdk-abstractions@2.0.0";

// ============================================================================
// Helpers
// ============================================================================

function getEnv(key: string): string | undefined {
  return Deno.env.get(key);
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

  log.info(
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
    log.info("Building wallet...");
    const walletSeed = seedOrMnemonic.seed || midnightNetworkConfig.walletSeed;
    if (!walletSeed) throw new Error("No seed provided");

    walletResult = await buildWalletFacade(
      resolvedNetworkUrls,
      walletSeed,
      resolvedNetworkId,
    );

    log.info(`Wallet seed: ${walletSeed}`);
    log.info(`Dust address: ${walletResult.dustAddress}`);
    log.info(`Unshielded address: ${walletResult.unshieldedAddress}`);

    // ---- Sync and show ALL balances ----
    log.info("Syncing wallet (shielded + unshielded + dust)...");
    const { shieldedBalance, unshieldedBalance, dustBalance } =
      await syncAndWaitForFunds(walletResult.wallet);

    log.info("==========================================");
    log.info("Wallet Balances");
    log.info("==========================================");
    log.info(`Shielded Balance:   ${shieldedBalance} NIGHT`);
    log.info(`Unshielded Balance: ${unshieldedBalance} NIGHT`);
    log.info(`Dust Balance:       ${dustBalance} DUST`);
    log.info("==========================================");

    // ---- Ensure dust is available for tx fees ----
    let currentDust = dustBalance;
    if (currentDust === 0n) {
      if (unshieldedBalance > 0n) {
        log.info("Dust is 0 but unshielded funds available. Registering Night UTXOs for dust generation...");
        const success = await registerNightForDust(walletResult);
        if (success) {
          currentDust = await waitForDustFunds(walletResult.wallet, {
            timeoutMs: 60_000,
          });
          log.info(`Dust after registration: ${currentDust} DUST`);
        } else {
          log.warn("Dust registration failed. Deployment may fail due to insufficient fees.");
        }
      } else {
        log.warn("No dust and no unshielded funds. Deployment will likely fail.");
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

    log.info("Wallet built successfully.");

    // ---- Configure providers ----
    log.info("Configuring providers...");
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
    log.info("Providers configured.");

    // ---- Deploy contract ----
    log.info("Deploying contract...");

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
      // deno-lint-ignore no-explicit-any
      initialPrivateState: Contract.PrivateState<any>;
      signingKey?: SigningKey;
      // deno-lint-ignore no-explicit-any
      args: Contract.InitializeParameters<any>;
    } = {
      // deno-lint-ignore no-explicit-any
      compiledContract: MyCompiledContract as any,
      privateStateId: config.privateStateId as PrivateStateId,
      // deno-lint-ignore no-explicit-any
      initialPrivateState: config.initialPrivateState as Contract.PrivateState<any>,
      args: (deployArgs && deployArgs.length > 0
        ? deployArgs
        // deno-lint-ignore no-explicit-any
        : []) as Contract.InitializeParameters<any>,
      signingKey: undefined,
    };

    const deployedContract = await deployContract(
      providers,
      // deno-lint-ignore no-explicit-any
      deployOptions as any,
    );
    log.info("Contract deployed.");

    const contractAddress =
      deployedContract.deployTxData.public.contractAddress;
    log.info(`Contract address: ${contractAddress}`);

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
    log.info(`Contract address saved to ${outputPath} (network: ${resolvedNetworkId})`);

    return contractAddress;
  } catch (e) {
    if (e instanceof Error) {
      log.error(`Deployment failed: ${e.message}`);
    } else {
      log.error("An unknown error occurred during deployment.");
    }
    throw e;
  } finally {
    if (walletResult) {
      log.info("Closing wallet...");
      try {
        await walletResult.wallet.stop();
      } catch {
        // Ignore close errors
      }
      log.info("Wallet closed.");
    }
    log.info("Waiting for Level DB cleanup...");
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
    Deno.exit(0);
  })
  .catch((e: unknown) => {
    console.error("Unhandled error:", e);
    Deno.exit(1);
  });

import { EffectstreamConfig } from "@effectstream/wallets";
import { hardhat, arbitrumSepolia, arbitrum } from "viem/chains";

export const ENV = {
  L2_CONTRACT_ADDRESS: (import.meta.env.VITE_L2_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`,
  BATCHER_URL: import.meta.env.VITE_BATCHER_URL || "http://localhost:3334",
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:9999",
  CHAIN: import.meta.env.VITE_CHAIN || "hardhat",
  MIDNIGHT_NETWORK_ID: import.meta.env.VITE_MIDNIGHT_NETWORK_ID || "undeployed",
};

const syncProtocolName = "mainEvmRPC";
const useBatching = true;

// Security-namespace prefix the wallet signs into every batched message. MUST
// match the batcher's BatcherConfig.namespace and the node's
// setSecurityNamespace(...) in packages/shared/data-types/src/config*.ts.
const securityNamespace = "evm-midnight-node";

const chains: Record<string, any> = { hardhat, arbitrumSepolia, arbitrum };
const chain = chains[ENV.CHAIN] ?? hardhat;

export const EngineConfig = new EffectstreamConfig(
  securityNamespace,
  syncProtocolName,
  ENV.L2_CONTRACT_ADDRESS,
  chain,
  undefined,
  ENV.BATCHER_URL,
  useBatching
);

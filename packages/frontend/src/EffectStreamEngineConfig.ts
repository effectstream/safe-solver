import { PaimaEngineConfig } from "@paimaexample/wallets";
import { hardhat, arbitrumSepolia, arbitrum } from "viem/chains";

export const ENV = {
  L2_CONTRACT_ADDRESS: (import.meta.env.VITE_L2_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`,
  BATCHER_URL: import.meta.env.VITE_BATCHER_URL || "http://localhost:3334",
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:9999",
  CHAIN: import.meta.env.VITE_CHAIN || "hardhat",
  MIDNIGHT_NETWORK_ID: import.meta.env.VITE_MIDNIGHT_NETWORK_ID || "undeployed",
}

const APP_NAME = "";
const SYNC_PROTOCOL_NAME = "mainEvmRPC";

const chains: Record<string, any> = { hardhat, arbitrumSepolia, arbitrum };
const chain = chains[ENV.CHAIN] ?? hardhat;
const useBatching = true;

// Configuration
export const EngineConfig = new PaimaEngineConfig(
  APP_NAME, // app name
  SYNC_PROTOCOL_NAME, // sync protocol name
  ENV.L2_CONTRACT_ADDRESS, // L2 contract address
  chain, // l2 chain
  undefined, // use default abi
  ENV.BATCHER_URL, // batcher url
  useBatching // use batching
);

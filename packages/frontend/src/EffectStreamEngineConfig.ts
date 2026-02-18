import { PaimaEngineConfig } from "@paimaexample/wallets";
import { hardhat } from "viem/chains";

// TODO We need to set this from env variables
export const ENV = {
  L2_CONTRACT_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,
  BATCHER_URL: "https://batcher-game1.paimastudios.com",
  API_URL: "https://api-game1.paimastudios.com",
}

const APP_NAME = "";
const SYNC_PROTOCOL_NAME = "mainEvmRPC";
const chain = hardhat as any;
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

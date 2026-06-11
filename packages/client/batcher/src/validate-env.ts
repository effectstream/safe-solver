import { validateEnv } from "@safe-solver/data-types/validate-env";

const effectstreamEnv = process.env.EFFECTSTREAM_ENV ?? "dev";

// Hardhat account #1 — same default as packages/client/node/.env.dev
const DEV_BATCHER_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

if (effectstreamEnv === "dev") {
  validateEnv("Batcher (dev)", [
    { name: "EFFECTSTREAM_ENV", required: true, secret: false },
    {
      name: "BATCHER_EVM_SECRET_KEY",
      required: true,
      secret: true,
      defaultValue: DEV_BATCHER_KEY,
    },
  ]);
} else if (effectstreamEnv === "preview") {
  validateEnv("Batcher (preview)", [
    { name: "EFFECTSTREAM_ENV", required: true, secret: false },
    { name: "ARBITRUM_SEPOLIA_RPC", required: true, secret: true },
    { name: "BATCHER_EVM_SECRET_KEY", required: true, secret: true },
    { name: "MIDNIGHT_WALLET_SEEDS", required: true, secret: true },
  ]);
} else if (effectstreamEnv === "mainnet") {
  validateEnv("Batcher (mainnet)", [
    { name: "EFFECTSTREAM_ENV", required: true, secret: false },
    { name: "ARBITRUM_ONE_FULL", required: true, secret: true },
    { name: "BATCHER_EVM_SECRET_KEY", required: true, secret: true },
    { name: "MIDNIGHT_WALLET_SEEDS", required: true, secret: true },
  ]);
} else {
  throw new Error(`Invalid EFFECTSTREAM_ENV for batcher: ${effectstreamEnv}`);
}

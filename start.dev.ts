import path from "node:path";
import type { OrchestratorConfig } from "@effectstream/orchestrator/config";
import { launchPglite, DbNames } from "@effectstream/orchestrator/launch-pglite";
import { launchEvm, EvmNames } from "@effectstream/orchestrator/launch-evm";
import { launchMidnight, MidnightNames } from "@effectstream/orchestrator/launch-midnight";

const root = import.meta.dirname!;
const evmContractsDir = path.join(root, "packages/shared/contracts/evm-contracts");
const midnightContractsDir = path.join(root, "packages/shared/contracts/midnight-contracts");
const midnightDeps = [MidnightNames.CONTRACT_DEPLOY];

export default {
  processes: [
    ...launchPglite().map((p) =>
      p.name === "pglite" ? { ...p, env: { ...p.env, DEBUG_PGLITE: "0" } } : p
    ),
    ...launchEvm("@safe-solver/evm-contracts", { cwd: evmContractsDir }),
    ...launchMidnight("@safe-solver/midnight-contracts", { cwd: midnightContractsDir }, {
      env: { MIDNIGHT_STORAGE_PASSWORD: "YourPasswordMy1!" },
    }),

    {
      name: "sync",
      description: "Safe Solver sync node",
      args: ["run", "packages/client/node/src/main.dev.ts"],
      waitToExit: false,
      type: "system-dependency",
      env: {
        PGLITE: "true",
        EFFECTSTREAM_ENV: "dev",
        NODE_ENV: "development",
      },
      dependsOn: [
        DbNames.PGLITE_WAIT,
        EvmNames.GENERATE_MOD,
        ...midnightDeps,
      ],
    },

    {
      name: "batcher",
      description: "Transaction batcher (EVM + Midnight)",
      args: ["run", "--filter", "@safe-solver/batcher", "start"],
      waitToExit: false,
      type: "system-dependency",
      link: "http://localhost:3334",
      stopProcessAtPort: [3334],
      env: { EFFECTSTREAM_ENV: "dev" },
      dependsOn: [EvmNames.GENERATE_MOD, ...midnightDeps],
    },

    {
      name: "serve-frontend",
      description: "Frontend dev server",
      cwd: path.join(root, "packages/frontend"),
      args: ["run", "dev"],
      waitToExit: false,
      type: "system-dependency",
      link: "http://localhost:5173",
      stopProcessAtPort: [5173],
      dependsOn: [EvmNames.GENERATE_MOD, ...midnightDeps],
    },
  ],
} satisfies OrchestratorConfig;

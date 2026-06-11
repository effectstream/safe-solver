import path from "node:path";
import type { OrchestratorConfig } from "@effectstream/orchestrator/config";

const root = import.meta.dirname!;

export default {
  processes: [
    {
      name: "sync",
      description: "Safe Solver sync node (preview)",
      args: ["run", "packages/client/node/src/main.preview.ts"],
      waitToExit: false,
      type: "system-dependency",
      env: {
        EFFECTSTREAM_ENV: "preview",
        NODE_ENV: "development",
      },
    },
    {
      name: "batcher",
      description: "Transaction batcher (preview)",
      args: ["run", "--filter", "@safe-solver/batcher", "start"],
      waitToExit: false,
      type: "system-dependency",
      link: "http://localhost:3334",
      stopProcessAtPort: [3334],
      env: { EFFECTSTREAM_ENV: "preview" },
    },
    {
      name: "serve-frontend",
      description: "Frontend dev server (preview)",
      cwd: path.join(root, "packages/frontend"),
      args: ["run", "dev", "--mode", "testnet"],
      waitToExit: false,
      type: "system-dependency",
      link: "http://localhost:5173",
      stopProcessAtPort: [5173],
    },
  ],
} satisfies OrchestratorConfig;

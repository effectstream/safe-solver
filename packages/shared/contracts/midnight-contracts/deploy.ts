import {
  deployMidnightContract,
} from "@effectstream/midnight-contracts/deploy";

import {
  midnight_data,
  witnesses as midnightDataWitnesses,
} from "./contract-midnight-data/src/index.original.ts";

import type { DeployConfig } from "@effectstream/midnight-contracts/types";

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
    extractWalletAddress: true, // Extract wallet address and replace last arg with initialOwner
  },
];

const start = async () => {
  for (const config of configs) {
    await deployMidnightContract(config);
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

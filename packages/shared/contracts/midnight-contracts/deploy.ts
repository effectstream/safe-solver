import { deployMidnightContract, type DeployConfig } from "@paimaexample/midnight-contracts/deploy";


        import {
            unshielded_erc20,
            witnesses as unshielded_erc20Witnesses,
        } from "./unshielded-erc20/src/index.original.ts";
    

const configs: DeployConfig[] = [
  
       {
        contractName: "unshielded-erc20",
        contractFileName: "contract-unshielded-erc20.json",
        contractClass: unshielded_erc20.Contract,
        witnesses: unshielded_erc20Witnesses,
        privateStateId: "unshielded_erc20State",
        initialPrivateState: {},
        deployArgs: [],
        privateStateStoreName: "unshielded-erc20-private-state",
        extractWalletAddress: true, // Extract wallet address and replace last arg with initialOwner
    }
 
];

const start = async () => {
  for (const config of configs) {
    await deployMidnightContract(config);
  }
}

start()
  .then(() => {
    console.log("Deployment successful");
    Deno.exit(0);
  }).catch((e: unknown) => {
    console.error("Unhandled error:", e);
    Deno.exit(1);
  });
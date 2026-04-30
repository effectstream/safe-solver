import { contractAddressesEvmMain } from "@safe-solver/evm-contracts";
import { readMidnightContract } from "@paimaexample/midnight-contracts/read-contract";
import * as midnightDataContract from "@safe-solver/midnight-contract-midnight-data/contract";

import {
  ConfigBuilder,
  ConfigNetworkType,
  ConfigSyncProtocolType,
} from "@paimaexample/config";
import { arbitrum } from "viem/chains";
import { midnightNetworkConfig } from "@paimaexample/midnight-contracts/midnight-env";

import * as builtin from "@paimaexample/sm/builtin";
import { dirname, resolve } from "@std/path";

const currentDir = dirname(new URL(import.meta.url).pathname);

const EVM_RPC_URL = Deno.env.get("ARBITRUM_ONE_RPC") as string;
if (!EVM_RPC_URL) {
  throw new Error("ARBITRUM_ONE_RPC is not set");
}
if (midnightNetworkConfig.id !== 'mainnet') {
  throw new Error("Invalid midnight network id for mainnet environment");
}

const mainSyncProtocolName = "mainNtp";
let launchStartTime: number | undefined;
let arbTip: number = 1;

export const config = new ConfigBuilder()
  .setNamespace((builder) => builder.setSecurityNamespace("[scope]"))
  .buildNetworks((builder) =>
    builder
      .addNetwork({
        name: "ntp",
        type: ConfigNetworkType.NTP,
        startTime: launchStartTime ?? new Date().getTime(),
        blockTimeMS: 1000,
      })
      .addViemNetwork({
        ...arbitrum,
        rpcUrls: {
          default: {
            http: [EVM_RPC_URL],
          },
        },
        name: "evmMain",
      })
      .addNetwork({
        name: "midnight",
        type: ConfigNetworkType.MIDNIGHT,
        genesisHash:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
        networkId: midnightNetworkConfig.id,
        nodeUrl: midnightNetworkConfig.node,
      })
  )
  .buildDeployments(builder => builder)
  .buildSyncProtocols((builder) =>
    builder
      .addMain(
        (networks) => networks.ntp,
        (network, deployments) => ({
          name: mainSyncProtocolName,
          type: ConfigSyncProtocolType.NTP_MAIN,
          chainUri: "",
          startBlockHeight: 1,
          pollingInterval: 1000,
        })
      )
      .addParallel(
        (networks) => networks.evmMain,
        (network, deployments) => ({
          name: "mainEvmRPC",
          type: ConfigSyncProtocolType.EVM_RPC_PARALLEL,
          chainUri: network.rpcUrls.default.http[0],
          startBlockHeight: arbTip,
          pollingInterval: 1000,
          stepSize: 30,
          confirmationDepth: 0,
        })
      )
      .addParallel(
        (networks) => networks.midnight,
        (network, deployments) => ({
          name: "parallelMidnight",
          type: ConfigSyncProtocolType.MIDNIGHT_PARALLEL,
          startBlockHeight: 1,
          pollingInterval: 6000,
          indexer: midnightNetworkConfig.indexer,
          indexerWs: midnightNetworkConfig.indexerWS,
          delayMs: 60000,
          stepSize: 2,
        })
      )
  )
  .buildPrimitives((builder) =>
    builder
      .addPrimitive(
        (syncProtocols) => syncProtocols.mainEvmRPC,
        (network, deployments, syncProtocol) => ({
          name: "primitive_effectstreaml2",
          type: builtin.PrimitiveTypeEVMPaimaL2,
          startBlockHeight: 0,
          contractAddress:
            contractAddressesEvmMain().chain42161[
              "effectstreaml2Module#effectstreaml2"
            ],
          stateMachinePrefix: `event_evm_effectstreaml2`,
        })
      )
      .addPrimitive(
        (syncProtocols) => syncProtocols.parallelMidnight,
        (network, deployments, syncProtocol) => ({
          name: "primitive_midnight-data",
          type: builtin.PrimitiveTypeMidnightGeneric,
          startBlockHeight: 1,
          contractAddress: readMidnightContract(
            "contract-midnight-data",
            {
              baseDir: resolve(currentDir, "..", "..", "contracts", "midnight-contracts"),
              networkId: midnightNetworkConfig.id,
            },
          ).contractAddress,
          stateMachinePrefix: "event_midnight",
          contract: { ledger: midnightDataContract.ledger },
          networkId: midnightNetworkConfig.id,
        })
      )
  )
  .build();

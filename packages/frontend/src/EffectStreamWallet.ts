import {
  allInjectedWallets,
  // PaimaEngineConfig,
  walletLogin,
  WalletMode,
  WalletNameMap,
} from "@paimaexample/wallets";
import { hardhat } from "viem/chains";
import { LocalWallet } from "@thirdweb-dev/wallets";
import { getChainByChainIdAsync } from "@thirdweb-dev/chains";
import { effectStreamService } from "./EffectStreamService";
import { EngineConfig } from "./EffectStreamEngineConfig";

interface IWallet {
  walletAddress: string;
  provider: {
    getAddress: () => { address: string, type: number },
    signMessage: (message: string) => Promise<string>
  };
  mode?: number;
}

export interface WalletOption {
  name: string;
  mode: number;
  preference: { name: string };
  types: string[];
  metadata: any;
  isInjected?: boolean;
  checkChainId?: boolean;
}

let localWallet: IWallet | null = null;
let connectedWallet: IWallet | null = null;
let midnightAddress: string | null = null;

export function truncateAddress(addr: string): string {
  if (addr.startsWith("0x") && addr.length > 12) {
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  }
  if (addr.startsWith("mn_") && addr.length > 16) {
    return addr.substring(0, 10) + '...' + addr.substring(addr.length - 4);
  }
  return addr;
}

export function getConnectedWallet() {
  return connectedWallet;
}

export function getLocalWallet() {
  return localWallet;
}

export function getMidnightAddress() {
  return midnightAddress;
}

export async function initializeLocalWallet() {
  if (localWallet) return localWallet;

  async function getLocalWallet() {
    const chain = await getChainByChainIdAsync(EngineConfig.paimaL2Chain.id);
    const wallet = new LocalWallet({ chain });
    await wallet.loadOrCreate({
      strategy: "encryptedJson",
      password: "safe-solver",
    });
    await wallet.connect();
    return await wallet.getSigner();
  }

  try {
    const loginOptions = {
      mode: WalletMode.EvmEthers,
      preferBatchedMode: true,
      connection: {
        metadata: {
          name: "thirdweb.localwallet",
          displayName: "Local Wallet",
        },
        api: await getLocalWallet(),
      },
    };

    const walletLoginResult = await walletLogin(loginOptions as any);
    if (walletLoginResult.success) {
      localWallet = walletLoginResult.result as IWallet;
      return localWallet;
    } else {
      throw new Error(walletLoginResult.errorMessage || '');
    }
  } catch (e) {
    console.error("Failed to initialize local wallet", e);
    return null;
  }
}

/**
 * Check on page load if the local wallet already has a delegation.
 * If so, update the Connect Wallet button and SET PLAYER NAME button.
 */
export async function checkExistingDelegation() {
  const connectWalletBtn = document.getElementById('btn-connect-wallet');

  let local = localWallet;
  if (!local) {
    local = await initializeLocalWallet();
  }
  if (!local) return;

  try {
    const info = await effectStreamService.getAddressInfo(local.walletAddress);
    if (info && info.account_id !== null) {
      const delegation = await effectStreamService.getDelegation(info.account_id);
      if (delegation && delegation.delegate_to_address) {
        midnightAddress = delegation.delegate_to_address;
        if (connectWalletBtn) {
          connectWalletBtn.textContent = "WALLET CONNECTED";
        }
      }
    }
  } catch (e) {
    // Not found or error — no delegation yet
  }
}

export async function updateSetNameButtonLabel() {
  const btnSetName = document.getElementById('btn-set-name');
  if (!btnSetName) return;

  btnSetName.style.display = 'inline-block';

  let wallet = getConnectedWallet();
  let local = getLocalWallet();
  if (!local) {
    local = await initializeLocalWallet();
  }

  // Determine the effective address (Account Primary Address if available)
  let effectiveAddress: string | null = null;
  const currentAddress = midnightAddress || (wallet && wallet.walletAddress) || (local && local.walletAddress);

  if (currentAddress) {
    try {
      const info = await effectStreamService.getAddressInfo(currentAddress);
      if (info && info.account_id !== null) {
        // If delegated, show the delegation address; otherwise show primary
        const delegation = await effectStreamService.getDelegation(info.account_id);
        if (delegation && delegation.delegate_to_address) {
          effectiveAddress = delegation.delegate_to_address;
        } else {
          const accountInfo = await effectStreamService.getAccountInfo(info.account_id);
          if (accountInfo && accountInfo.primary_address) {
            effectiveAddress = accountInfo.primary_address;
          }
        }
      }
    } catch (e) {
      console.error("Error determining primary address", e);
    }

    // Fallback to current address if not part of account or check failed
    if (!effectiveAddress) {
      effectiveAddress = currentAddress;
    }
  }

  if (!effectiveAddress) {
    btnSetName.textContent = "SET PLAYER NAME";
    return;
  }

  // 1. Get User Account Name (only use if it's a custom name, not a default address)
  try {
    const profile = await effectStreamService.getUserProfile(effectiveAddress);
    if (profile && profile.name && !profile.name.startsWith("0x") && !profile.name.startsWith("mn_")) {
      btnSetName.textContent = profile.name;
      btnSetName.title = effectiveAddress;
      return;
    }
  } catch (e) {
    // ignore
  }

  // 2. Use Effective Address (truncated, full on hover)
  btnSetName.textContent = truncateAddress(effectiveAddress);
  btnSetName.title = effectiveAddress;
}

/**
 * Connect to the Midnight extension wallet via dapp-connector-api.
 * Returns the address from the wallet, or null if not available.
 */
export async function connectMidnightWallet(): Promise<string | null> {
  try {
    // Wait a bit for wallets to inject
    await new Promise(resolve => setTimeout(resolve, 200));

    const injectedWallets = await allInjectedWallets({ signatureSupport: false, transactionSupport: false });
    const midnightWallets = injectedWallets?.[WalletMode.Midnight] ?? [];

    if (!midnightWallets.length) {
      console.warn("No Midnight wallet extension found");
      alert("No Midnight wallet extension found. Please install the Midnight Lace wallet.");
      return null;
    }

    // Connect to the first available Midnight wallet
    const wallet = midnightWallets[0];
    console.log("Connecting to Midnight wallet:", wallet.metadata.displayName);

    const loginOptions = {
      mode: WalletMode.Midnight,
      preference: { name: wallet.metadata.name },
      preferBatchedMode: false,
      networkId: import.meta.env.VITE_MIDNIGHT_NETWORK_ID,
    };

    const result = await walletLogin(loginOptions as any);

    if (!result.success) {
      console.error("Midnight wallet login failed:", result.errorMessage);
      alert("Failed to connect Midnight wallet: " + result.errorMessage);
      return null;
    }

    connectedWallet = { ...result.result, mode: WalletMode.Midnight };
    midnightAddress = connectedWallet.walletAddress;
    console.log("Midnight wallet connected, address:", midnightAddress);

    return midnightAddress;
  } catch (e) {
    console.error("Failed to connect Midnight wallet", e);
    alert("Failed to connect Midnight wallet.");
    return null;
  }
}

export async function getAvailableWallets(): Promise<WalletOption[]> {
  const wallets: WalletOption[] = [];

  // 1. Fetch Injected Wallets
  try {
    // Wait a bit for wallets to inject
    await new Promise(resolve => setTimeout(resolve, 200));

    const injectedWallets = await allInjectedWallets({ signatureSupport: false, transactionSupport: false });

    if (injectedWallets) {
      for (const [modeStr, walletList] of Object.entries(injectedWallets)) {
        const mode = Number(modeStr);
        if (Array.isArray(walletList) && walletList.length > 0) {
          for (const w of walletList) {
            const networkType = ((WalletNameMap as any)[mode] || "").toLowerCase();

            wallets.push({
              name: w.metadata.displayName,
              mode,
              preference: { name: w.metadata.name },
              types: [networkType],
              metadata: w.metadata,
              isInjected: true,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch injected wallets:", e);
  }

  return wallets;
}

export async function login(walletOption: WalletOption) {
  let checkChainId = true;

  // TODO This should be a system wide setting
  if (walletOption.metadata && (walletOption.metadata.name === "app.phantom" || walletOption.metadata.name === "com.exodus.web3-wallet")) {
    checkChainId = false;
  }

  if (walletOption.checkChainId !== undefined) {
    checkChainId = walletOption.checkChainId;
  }

  const loginOptions = {
    mode: walletOption.mode,
    preference: walletOption.preference,
    preferBatchedMode: false,
    chain: (walletOption.mode === WalletMode.EvmInjected || walletOption.mode === WalletMode.EvmEthers) ? (hardhat as any) : undefined,
    checkChainId: checkChainId,
  };

  console.log("Logging in with options:", loginOptions);

  const result = await walletLogin(loginOptions);

  if (!result.success) throw new Error("Cannot login: " + JSON.stringify(result.errorMessage));
  connectedWallet = { ...result.result, mode: walletOption.mode };

  if (localWallet && connectedWallet.walletAddress) {
    console.log(`Associating Local Wallet ${localWallet.walletAddress} with Real Wallet ${connectedWallet.walletAddress}`);
    await effectStreamService.connectWallets(localWallet as any, connectedWallet as any);
  }

  return connectedWallet;
}

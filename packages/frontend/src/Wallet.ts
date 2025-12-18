import {
  allInjectedWallets,
  PaimaEngineConfig,
  walletLogin,
  WalletMode,
  WalletNameMap,
} from "@paimaexample/wallets";
import { hardhat } from "viem/chains";
import { LocalWallet } from "@thirdweb-dev/wallets";
import { getChainByChainIdAsync } from "@thirdweb-dev/chains";
import { showCustomAlert } from "./Utils";
import { mockService } from "./MockService";
import { state } from "./GameState";
import { updateTokenDisplay } from "./GameLogic";
import { EngineConfig } from "./EngineConfig";
export let localWallet = null;


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
    const loginOptions =  {
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
        
    const walletLoginResult = await walletLogin(loginOptions);
    localWallet = walletLoginResult.result;
    return localWallet;
  } catch (e) {
    console.error("Failed to initialize local wallet", e);
    return null;
  }
}

let connectedWallet: any = null;

interface WalletOption {
  name: string;
  mode: number;
  preference: { name: string };
  types: string[];
  metadata: any;
  isInjected?: boolean;
  checkChainId?: boolean;
}

export async function getAvailableWallets(): Promise<WalletOption[]> {
  const wallets: WalletOption[] = [];
  
  // 1. Fetch Injected Wallets
  try {
    // Wait a bit for wallets to inject
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const injectedWallets = await allInjectedWallets();
    
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

export function getConnectedWallet() {
  return connectedWallet;
}

export async function login(walletOption: WalletOption) {
  let checkChainId = true;
  
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
  
  if (!result.success) throw new Error("Cannot login: " + result.errorMessage);
  connectedWallet = { ...result.result, mode: walletOption.mode };

  if (localWallet && connectedWallet.walletAddress) {
    console.log(`Associating Local Wallet ${localWallet.walletAddress} with Real Wallet ${connectedWallet.walletAddress}`);
    // Future: Add logic to cryptographically associate the wallets (e.g. sign a message)
    await mockService.connectWallets(localWallet, connectedWallet);
  }

  return connectedWallet;
}

export function initWalletUI() {
  const connectWalletBtn = document.getElementById('btn-connect-wallet');
  const walletModal = document.getElementById('wallet-modal');
  const closeModal = document.getElementById('close-modal');
  const walletList = document.getElementById('wallet-list');
  const loadingWallets = document.getElementById('loading-wallets');

  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      if (walletModal) {
          walletModal.style.display = 'block';
          renderWalletList();
      }
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      if (walletModal) walletModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target == walletModal && walletModal) {
      walletModal.style.display = 'none';
    }
  });

  async function renderWalletList() {
    if (!walletList || !loadingWallets) return;
    
    walletList.innerHTML = '';
    loadingWallets.style.display = 'block';

    try {
      const wallets = await getAvailableWallets();
      loadingWallets.style.display = 'none';
      
      if (wallets && wallets.length > 0) {
        wallets.forEach(wallet => {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.className = 'wallet-btn';
          
          let iconHtml = '';
          if (wallet.metadata && wallet.metadata.icon) {
            iconHtml = `<img src="${wallet.metadata.icon}" width="20" height="20" style="margin-right: 10px; vertical-align: middle;">`;
          } else {
            const initial = wallet.metadata && wallet.metadata.displayName ? wallet.metadata.displayName.charAt(0) : '?';
            iconHtml = `<span style="display:inline-block; width:20px; text-align:center; background:#ccc; margin-right:10px; border-radius:3px;">${initial}</span>`;
          }

          btn.innerHTML = `
            <div style="display:flex; align-items:center;">
              ${iconHtml}
              <div style="display:flex; flex-direction:column; align-items:flex-start;">
                <span style="font-weight:bold;">${wallet.name}</span>
                <span style="font-size:0.8em; color:#666;">${wallet.types.join(', ')}</span>
              </div>
            </div>
          `;
          
          btn.onclick = () => handleLogin(wallet);
          li.appendChild(btn);
          walletList.appendChild(li);
        });
      } else {
        walletList.innerHTML = '<li>No wallets found.</li>';
      }

      const localWalletInfo = document.getElementById('local-wallet-info');
      if (localWalletInfo) {
          const wallet = await initializeLocalWallet();
          if (wallet) {
              const address = wallet.walletAddress;
              localWalletInfo.innerHTML = `
                  <div style="margin-top: 10px;">
                    <p style="margin:0; font-weight:bold;">Local Wallet Address:</p>
                    <p style="margin:5px 0; font-family:monospace; font-size:0.85em; background: #f0f0f0; padding: 5px; border-radius: 4px;">${address}</p>
                    <p style="margin:0; font-size:0.8em; color:#666;">This is an auto-generated local wallet unique to your browser session.</p>
                  </div>
              `;
          }
      }
    } catch (e: any) {
      loadingWallets.style.display = 'none';
      walletList.innerHTML = `<li>Error loading wallets: ${e.message}</li>`;
    }
  }

  async function handleLogin(walletOption: WalletOption) {
    if (!walletModal || !connectWalletBtn) return;
    
    try {
      walletModal.style.display = 'none';
      connectWalletBtn.textContent = 'Connecting...';
      
      const wallet = await login(walletOption);
      
      connectWalletBtn.textContent = 'Verifying...';
      
      // Fetch user profile from mock service
      if (wallet.walletAddress) {
        const profile = await mockService.getUserProfile(wallet.walletAddress);
        state.tokens = profile.balance;
        updateTokenDisplay();

        // Show Set Name button
        const btnSetName = document.getElementById('btn-set-name');
        if (btnSetName) {
            btnSetName.style.display = 'inline-block';
            if (profile.name) {
                btnSetName.textContent = profile.name;
            } else {
                btnSetName.textContent = 'SET NAME';
            }
        }
      }

      connectWalletBtn.textContent = 'Connected: ' + (wallet.walletAddress ? wallet.walletAddress.substring(0, 6) + '...' + wallet.walletAddress.substring(wallet.walletAddress.length - 4) : 'Unknown');
      
      console.log("Connected wallet:", wallet);
      
    } catch (err: any) {
      console.error(err);
      showCustomAlert('Login failed: ' + err.message);
      connectWalletBtn.textContent = 'CONNECT WALLET';
    }
  }
}


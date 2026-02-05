import { showCustomAlert } from "./Utils";
import { effectStreamService } from "./EffectStreamService";
import { getConnectedWallet, getLocalWallet, initializeLocalWallet } from "./EffectStreamWallet";
import { state } from "./GameState";
import { updateTokenDisplay } from "./GameLogic";

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
    const currentAddress = (wallet && wallet.walletAddress) || (local && local.walletAddress);

    if (currentAddress) {
        try {
            const info = await effectStreamService.getAddressInfo(currentAddress);
            if (info && info.account_id !== null) {
                const accountInfo = await effectStreamService.getAccountInfo(info.account_id);
                if (accountInfo && accountInfo.primary_address) {
                    effectiveAddress = accountInfo.primary_address;
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
        btnSetName.textContent = "SET NAME";
        return;
    }

    // 1. Get User Account Name (using effective address)
    let nameFound = false;
    try {
        const profile = await effectStreamService.getUserProfile(effectiveAddress);
        if (profile && profile.name) {
            btnSetName.textContent = profile.name;
            nameFound = true;
        }
    } catch (e) {
        // ignore
    }

    if (nameFound) return;

    // 2. Use Effective Address (truncated)
    const addr = effectiveAddress;
    btnSetName.textContent = addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
}


export function initWalletUI() {
    const connectWalletBtn = document.getElementById('btn-connect-wallet');
    const walletModal = document.getElementById('wallet-modal');
    const closeModal = document.getElementById('close-modal');
    const inputDelegateAddress = document.getElementById('input-delegate-address') as HTMLInputElement;
    const btnConfirmConnect = document.getElementById('btn-confirm-connect-wallet');
    const btnCancelConnect = document.getElementById('btn-cancel-connect-wallet');

    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            if (walletModal) {
                if (inputDelegateAddress) inputDelegateAddress.value = '';
                walletModal.style.display = 'block';
            }
        });
    }

    if (closeModal && walletModal) {
        closeModal.addEventListener('click', () => {
            walletModal.style.display = 'none';
        });
    }

    if (btnCancelConnect && walletModal) {
        btnCancelConnect.addEventListener('click', () => {
            walletModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === walletModal && walletModal) {
            walletModal.style.display = 'none';
        }
    });

    if (btnConfirmConnect && walletModal && inputDelegateAddress && connectWalletBtn) {
        btnConfirmConnect.addEventListener('click', async () => {
            const address = inputDelegateAddress.value.trim();
            if (!address) {
                showCustomAlert('Please enter a wallet address.');
                return;
            }

            const originalText = btnConfirmConnect.textContent;
            btnConfirmConnect.textContent = 'Sending...';
            (btnConfirmConnect as HTMLButtonElement).disabled = true;

            try {
                await effectStreamService.delegateToAddress(address);
                walletModal.style.display = 'none';
                const short = address.length > 10 ? address.substring(0, 6) + '...' + address.substring(address.length - 4) : address;
                connectWalletBtn.textContent = 'Delegated to: ' + short;

                const wallet = getLocalWallet();
                if (wallet?.walletAddress) {
                    const profile = await effectStreamService.getUserProfile(wallet.walletAddress);
                    state.tokens = profile.balance;
                    updateTokenDisplay();
                    await updateSetNameButtonLabel();
                }
            } catch (err: any) {
                console.error(err);
                showCustomAlert('Delegation failed: ' + (err?.message || String(err)));
            } finally {
                btnConfirmConnect.textContent = originalText || 'Connect';
                (btnConfirmConnect as HTMLButtonElement).disabled = false;
            }
        });
    }
}

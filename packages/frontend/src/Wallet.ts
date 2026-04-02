import { showCustomAlert } from "./Utils";
import { effectStreamService } from "./EffectStreamService";
import { getLocalWallet, connectMidnightWallet, updateSetNameButtonLabel } from "./EffectStreamWallet";
import { state } from "./GameState";
import { updateTokenDisplay } from "./GameLogic";

export { updateSetNameButtonLabel };

export async function initWalletUI() {
    const connectWalletBtn = document.getElementById('btn-connect-wallet');
    const walletModal = document.getElementById('wallet-modal');
    const closeModal = document.getElementById('close-modal');
    const inputDelegateAddress = document.getElementById('input-delegate-address') as HTMLInputElement;
    const btnConfirmConnect = document.getElementById('btn-confirm-connect-wallet');
    const btnCancelConnect = document.getElementById('btn-cancel-connect-wallet');



    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            // Connect to Midnight wallet extension
            const address = await connectMidnightWallet();
            if (address) {
                // Auto-fill the delegate address input
                if (inputDelegateAddress) {
                    inputDelegateAddress.value = address;
                }

                // Check if this address is already delegated
                try {
                    const info = await effectStreamService.getAddressInfo(address);
                    if (info && info.account_id !== null) {
                        const accountInfo = await effectStreamService.getAccountInfo(info.account_id);
                        if (accountInfo && accountInfo.primary_address === address) {
                            connectWalletBtn.textContent = "WALLET CONNECTED";
                        } else {
                            connectWalletBtn.textContent = "WALLET CONNECTED";
                            // Show the delegation modal so user can delegate
                            if (walletModal) walletModal.style.display = 'block';
                        }
                    } else {
                        connectWalletBtn.textContent = "WALLET CONNECTED";
                        // Show modal for delegation
                        if (walletModal) walletModal.style.display = 'block';
                    }
                } catch (e) {
                    connectWalletBtn.textContent = "WALLET CONNECTED";
                    // Show modal for delegation
                    if (walletModal) walletModal.style.display = 'block';
                }

                // Update the name button with address/delegated address
                await updateSetNameButtonLabel();
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
                // Update Connect Wallet button
                connectWalletBtn.textContent = 'WALLET CONNECTED';

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

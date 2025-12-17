import './style.css';
import './wallet.css';
import TWEEN from '@tweenjs/tween.js';
import { scene, camera, renderer, initScene, backgroundTexture } from './Scene';
import { showMainScreen, startGame, cashOut, updateTokenDisplay } from './GameLogic';
import { initInput } from './Input';
import { fixBackgroundSize, setupAlertModal, showCustomAlert } from './Utils';
import { Drill } from './Drill';
import { state, addTokens } from './GameState';
import { initWalletUI, getConnectedWallet, initializeLocalWallet } from './Wallet';
import { soundManager } from './SoundManager';
import { mockService } from './MockService';
import { particleManager } from './ParticleManager';

// Initialize Scene
initScene(() => {
    fixBackgroundSize(backgroundTexture);
});

// Initialize Input
initInput();
particleManager.init();

// Initialize Local Wallet (Auto-create)
initializeLocalWallet();

// Initialize Wallet UI
initWalletUI();
setupAlertModal();

// Initialize Token UI
const btnAddTokens = document.getElementById('btn-add-tokens');
const addTokensModal = document.getElementById('add-tokens-modal');
const closeAddTokensModal = document.getElementById('close-add-tokens-modal');
const btnConfirmAddTokens = document.getElementById('btn-confirm-add-tokens');
const btnCancelAddTokens = document.getElementById('btn-cancel-add-tokens');

if (btnAddTokens && addTokensModal) {
    btnAddTokens.addEventListener('click', () => {
        addTokensModal.style.display = 'block';
    });
}

if (closeAddTokensModal && addTokensModal) {
    closeAddTokensModal.addEventListener('click', () => {
        addTokensModal.style.display = 'none';
    });
}

if (btnCancelAddTokens && addTokensModal) {
    btnCancelAddTokens.addEventListener('click', () => {
        addTokensModal.style.display = 'none';
    });
}

if (btnConfirmAddTokens && addTokensModal) {
    btnConfirmAddTokens.addEventListener('click', async () => {
        // Change button text to indicate loading
        const originalText = btnConfirmAddTokens.innerText;
        btnConfirmAddTokens.innerText = "Adding...";
        
        try {
            await mockService.addTokens(10);
            addTokens(10);
            updateTokenDisplay();
            addTokensModal.style.display = 'none';
        } catch (e) {
            console.error("Failed to add tokens", e);
        } finally {
            btnConfirmAddTokens.innerText = originalText;
        }
    });
}

// Mute Button
const btnMute = document.getElementById('btn-mute');
if (btnMute) {
    btnMute.addEventListener('click', () => {
        const isMuted = soundManager.toggleMute();
        btnMute.innerText = isMuted ? '🔇' : '🔊';
    });
}

// Set Name Logic
const btnSetName = document.getElementById('btn-set-name');
const setNameModal = document.getElementById('set-name-modal');
const closeSetNameModal = document.getElementById('close-set-name-modal');
const btnConfirmSetName = document.getElementById('btn-confirm-set-name');
const btnCancelSetName = document.getElementById('btn-cancel-set-name');
const inputPlayerName = document.getElementById('input-player-name') as HTMLInputElement;

if (btnSetName && setNameModal) {
    btnSetName.addEventListener('click', async () => {
        setNameModal.style.display = 'block';
        const wallet = getConnectedWallet();
        if (wallet && wallet.walletAddress) {
             try {
                const profile = await mockService.getUserProfile(wallet.walletAddress);
                inputPlayerName.value = profile.name || '';
             } catch (e) {
                 console.error("Failed to load profile for name", e);
             }
        }
    });
}

if (closeSetNameModal && setNameModal) {
    closeSetNameModal.addEventListener('click', () => {
        setNameModal.style.display = 'none';
    });
}

if (btnCancelSetName && setNameModal) {
    btnCancelSetName.addEventListener('click', () => {
        setNameModal.style.display = 'none';
    });
}

if (btnConfirmSetName && setNameModal && inputPlayerName) {
    btnConfirmSetName.addEventListener('click', async () => {
        const name = inputPlayerName.value.trim();
        if (!name) {
            showCustomAlert("Please enter a name.");
            return;
        }

        const wallet = getConnectedWallet();
        if (!wallet || !wallet.walletAddress) {
            showCustomAlert("Wallet not connected.");
            return;
        }

        const originalText = btnConfirmSetName.innerText;
        btnConfirmSetName.innerText = "Saving...";

        try {
            await mockService.setUserName(wallet.walletAddress, name);
            setNameModal.style.display = 'none';
            if (btnSetName) {
                btnSetName.textContent = name;
            }
        } catch (e) {
            console.error("Failed to set name", e);
            showCustomAlert("Failed to save name.");
        } finally {
            btnConfirmSetName.innerText = originalText;
        }
    });
}

window.addEventListener('click', (event) => {
    if (event.target == addTokensModal && addTokensModal) {
        addTokensModal.style.display = 'none';
    }
    if (event.target == setNameModal && setNameModal) {
        setNameModal.style.display = 'none';
    }
});


// Initialize Drill
const drill = new Drill();

// UI Event Listeners
document.getElementById('btn-start')?.addEventListener('click', () => {
    startGame(false);
});

document.getElementById('btn-demo')?.addEventListener('click', () => {
    startGame(true);
});

document.getElementById('btn-cash-out')?.addEventListener('click', () => {
    cashOut();
});

// Show Main Screen initially
showMainScreen();
updateTokenDisplay();

// Animation Loop
let lastTime = 0;

function animate(time: number) {
    requestAnimationFrame(animate);
    
    // Calculate delta time in seconds
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // Cap dt to prevent huge jumps if tab was backgrounded
    const safeDt = Math.min(dt, 0.1);

    TWEEN.update(time);
    
    // Update all safes manually
    if (state.safes) {
        state.safes.forEach(safe => safe.update(safeDt));
    }

    particleManager.update(safeDt);

    drill.update();
    renderer.render(scene, camera);
}

animate(0);

// Handle resize
window.addEventListener('resize', () => {
    const container = document.getElementById('game-view');
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    fixBackgroundSize(backgroundTexture);
});

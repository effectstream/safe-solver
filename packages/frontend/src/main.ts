import TWEEN from '@tweenjs/tween.js';
import { scene, camera, renderer, initScene, backgroundTexture } from './Scene';
import { showMainScreen, startGame, cashOut, updateTokenDisplay } from './GameLogic';
import { initInput } from './Input';
import { fixBackgroundSize, setupAlertModal, showCustomAlert } from './Utils';
import { Drill } from './Drill';
import { state } from './GameState';
import { initWalletUI, getConnectedWallet, initializeLocalWallet, updateSetNameButtonLabel } from './Wallet';
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
initializeLocalWallet().then(async (wallet) => {
    if (wallet && wallet.walletAddress) {
        // Fetch profile for local wallet on startup
        try {
            const profile = await mockService.getUserProfile(wallet.walletAddress);
            // Tokens not used anymore for starting game
            updateTokenDisplay();

            await updateSetNameButtonLabel();
        } catch (e) {
            console.error("Failed to fetch initial profile", e);
        }
    }
});

// Initialize Wallet UI
initWalletUI();
setupAlertModal();

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
        let wallet = getConnectedWallet();
        if (!wallet) {
            wallet = await initializeLocalWallet();
        }

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

        let wallet = getConnectedWallet();
        if (!wallet) {
             wallet = await initializeLocalWallet();
        }
        
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

// How to Play Logic
const btnHowToPlay = document.getElementById('btn-how-to-play');
const howToPlayModal = document.getElementById('how-to-play-modal');
const closeHowToPlayModal = document.getElementById('close-how-to-play-modal');
const btnHowToPlayOk = document.getElementById('btn-how-to-play-ok');

if (btnHowToPlay && howToPlayModal) {
    btnHowToPlay.addEventListener('click', () => {
        howToPlayModal.style.display = 'block';
    });
}

if (closeHowToPlayModal && howToPlayModal) {
    closeHowToPlayModal.addEventListener('click', () => {
        howToPlayModal.style.display = 'none';
    });
}

if (btnHowToPlayOk && howToPlayModal) {
    btnHowToPlayOk.addEventListener('click', () => {
        howToPlayModal.style.display = 'none';
    });
}


window.addEventListener('click', (event) => {
    if (event.target == setNameModal && setNameModal) {
        setNameModal.style.display = 'none';
    }
    if (event.target == howToPlayModal && howToPlayModal) {
        howToPlayModal.style.display = 'none';
    }
});


// Initialize Drill
const drill = new Drill();

// UI Event Listeners
document.getElementById('btn-start')?.addEventListener('click', () => {
    startGame(false);
});

// Remove Play Demo button
const btnDemo = document.getElementById('btn-demo');
if (btnDemo) {
    btnDemo.style.display = 'none';
}

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

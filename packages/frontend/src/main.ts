import TWEEN from '@tweenjs/tween.js';
import { effectStreamService } from './EffectStreamService';
import { initializeLocalWallet, checkExistingDelegation } from './EffectStreamWallet';

import { scene, camera, renderer, initScene, backgroundTexture } from './Scene';
import { showMainScreen, startGame, cashOut, updateTokenDisplay } from './GameLogic';
import { initInput } from './Input';
import { fixBackgroundSize, setupAlertModal } from './Utils';
import { Drill } from './Drill';
import { state } from './GameState';
import { soundManager } from './SoundManager';
import { particleManager } from './ParticleManager';
import { initWalletUI, updateSetNameButtonLabel } from './Wallet';

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
            await effectStreamService.getUserProfile(wallet.walletAddress);
            updateTokenDisplay();
            await checkExistingDelegation();
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

// SET PLAYER NAME button is now display-only (shows address/delegated address)
// The set-name modal is no longer opened by clicking the button

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

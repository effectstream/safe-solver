import "./instrument"; // Sentry must init before all other code
import TWEEN from '@tweenjs/tween.js';
import { effectStreamService } from './EffectStreamService';
import type { AchievementInfo } from './EffectStreamService';
import { initializeLocalWallet, checkExistingDelegation, getLocalWallet, getConnectedWallet, getMidnightAddress } from './EffectStreamWallet';

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


// Footer overlay
const footerLink = document.getElementById('footer-link');
const footerOverlay = document.getElementById('footer-overlay');
const closeFooterOverlay = document.getElementById('close-footer-overlay');

if (footerLink && footerOverlay) {
    footerLink.addEventListener('click', (e) => {
        e.preventDefault();
        footerOverlay.style.display = 'block';
    });
}

if (closeFooterOverlay && footerOverlay) {
    closeFooterOverlay.addEventListener('click', () => {
        footerOverlay.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target === footerOverlay && footerOverlay) {
        footerOverlay.style.display = 'none';
    }
});

// Sidebar tabs (leaderboard / achievements)
let activeTab: "leaderboard" | "achievements" = "leaderboard";

function initSidebarTabs() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.sidebar-tab');
  const sidebarTitle = document.getElementById('sidebar-title');
  const leaderboardPanel = document.getElementById('leaderboard-panel');
  const achievementsList = document.getElementById('achievements-list');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab as "leaderboard" | "achievements";
      if (!target || target === activeTab) return;
      activeTab = target;

      tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));

      if (target === 'leaderboard') {
        if (sidebarTitle) sidebarTitle.innerText = 'Leaderboard';
        if (leaderboardPanel) leaderboardPanel.style.display = '';
        if (achievementsList) achievementsList.style.display = 'none';
      } else {
        if (sidebarTitle) sidebarTitle.innerText = 'Achievements';
        if (leaderboardPanel) leaderboardPanel.style.display = 'none';
        if (achievementsList) achievementsList.style.display = '';
        loadAchievements();
      }
    });
  });
}

function renderAchievements(allAchievements: AchievementInfo[], unlockedIds: string[]) {
  const container = document.getElementById('achievements-list');
  if (!container) return;
  container.innerHTML = '';

  const unlockedSet = new Set(unlockedIds);

  allAchievements.forEach((ach) => {
    const unlocked = unlockedSet.has(ach.name);
    const item = document.createElement('div');
    item.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;

    const img = document.createElement('img');
    img.className = 'achievement-icon';
    img.src = ach.iconURI || '';
    img.alt = ach.displayName;
    img.loading = 'lazy';
    item.appendChild(img);

    const info = document.createElement('div');
    info.className = 'achievement-info';

    const name = document.createElement('div');
    name.className = 'achievement-name';
    name.textContent = ach.displayName;
    info.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'achievement-desc';
    desc.textContent = ach.description;
    info.appendChild(desc);

    item.appendChild(info);
    container.appendChild(item);
  });
}

async function loadAchievements() {
  const allAchievements = await effectStreamService.getAchievements();

  let unlockedIds: string[] = [];
  const connected = getConnectedWallet();
  const local = getLocalWallet();
  const addr = getMidnightAddress() || (connected && connected.walletAddress) || (local && local.walletAddress);
  if (addr) {
    unlockedIds = await effectStreamService.getUserAchievements(addr);
  }

  renderAchievements(allAchievements, unlockedIds);
}

initSidebarTabs();

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

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { state, setScore, resetState, removeTokens, addTokens } from './GameState';
import { Safe } from './Safe';
import { scene, camera, ambientLight, pointLight, resetSceneLighting } from './Scene';
import { leaderboard } from './Leaderboard';
import { getConnectedWallet } from './Wallet';
import { showCustomAlert } from './Utils';
import { soundManager } from './SoundManager';
import { mockService } from './MockService';
import { particleManager } from './ParticleManager';

export function updateScoreDisplay() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.innerText = `Score: ${state.score.toFixed(2)}`;
}

export function updateLevelDisplay() {
    const levelEl = document.getElementById('level');
    if (levelEl) {
        levelEl.innerText = `Level: ${state.level}`;
        
        // Trigger highlight animation
        levelEl.classList.remove('level-highlight');
        void levelEl.offsetWidth; // Trigger reflow
        levelEl.classList.add('level-highlight');
    }
}

export function updateTokenDisplay() {
    const tokensEl = document.getElementById('tokens-display');
    const addTokensBtn = document.getElementById('btn-add-tokens');

    // Hide the separate tokens display element since we are using the button
    if (tokensEl) {
        tokensEl.style.display = 'none';
    }

    if (addTokensBtn) {
        addTokensBtn.style.display = 'block';
        if (state.tokens > 0) {
            addTokensBtn.innerText = `Tokens: ${state.tokens.toFixed(2)}`;
        } else {
            addTokensBtn.innerText = 'ADD TOKENS';
        }
    }
}

export function updateMultiplierDisplay() {
    const multEl = document.getElementById('multiplier-value');
    if (multEl) {
        // formula: 1 + (round - 1) * 0.55
        const multiplier = 1 + (state.level - 1) * 0.55;
        multEl.innerText = `${multiplier.toFixed(2)}x`;
    }
}

export function showMainScreen() {
    state.isPlaying = false;
    leaderboard.render();
    const mainScreen = document.getElementById('main-screen');
    const info = document.getElementById('info');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const cashOutBtn = document.getElementById('btn-cash-out');
    const multBadge = document.getElementById('multiplier-badge');

    if (mainScreen) {
        mainScreen.classList.remove('hidden');
        mainScreen.style.display = ''; // Reset display
    }
    if (info) info.classList.add('hidden');
    if (scoreEl) scoreEl.classList.add('hidden');
    if (levelEl) levelEl.classList.add('hidden');
    if (cashOutBtn) cashOutBtn.classList.add('hidden');
    if (multBadge) multBadge.classList.add('hidden');

    // Clean up current level if any
    state.safes.forEach(s => s.destroy());
    state.safes.length = 0;

    // Robust cleanup: Remove any orphaned Safe groups from scene
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        if (child.userData.isSafe) {
            scene.remove(child);
            child.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry.dispose();
                    if (obj.material instanceof THREE.Material) {
                        obj.material.dispose();
                    } else if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    }
                }
            });
        }
    }
}

export async function startGame(isDemo: boolean = false) {
    soundManager.play('bgm');
    state.isDemo = isDemo;


    if (!isDemo) {
        if (!removeTokens(1)) {
            showCustomAlert("Not enough tokens! Please add more tokens.");
            return;
        }
        updateTokenDisplay();
    }

    state.isPlaying = true;
    resetState(); // Reset level to 1, score, etc.
    updateScoreDisplay();
    
    const mainScreen = document.getElementById('main-screen');
    const info = document.getElementById('info');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const cashOutBtn = document.getElementById('btn-cash-out');
    const multBadge = document.getElementById('multiplier-badge');

    if (mainScreen) {
        mainScreen.classList.add('hidden');
        mainScreen.style.display = 'none'; // Force hide
    }

    if (info) info.classList.remove('hidden');
    if (scoreEl) scoreEl.classList.remove('hidden');
    if (levelEl) levelEl.classList.remove('hidden');
    if (cashOutBtn) cashOutBtn.classList.remove('hidden');
    if (multBadge) multBadge.classList.remove('hidden');

    await startLevel();
}

export function cashOut() {
    if (state.isDemo) {
        showCustomAlert(`Demo Game Over! You would have won ${state.score.toFixed(2)} tokens.`);
    } else {
        soundManager.play('cashout');
        const wallet = getConnectedWallet();
        const name = wallet?.walletAddress 
            ? `${wallet.walletAddress.substring(0, 6)}...${wallet.walletAddress.substring(wallet.walletAddress.length - 4)}` 
            : 'Guest';
        
        // Use the async addScore from leaderboard which calls MockService
        leaderboard.addScore(name, state.score);

        addTokens(state.score);
        updateTokenDisplay();
        showCustomAlert(`Cashed Out! +${state.score.toFixed(2)} Tokens`);
    }
    showMainScreen();
}

export async function startLevel() {
    state.isProcessing = true; // Block input while loading
    state.levelStartTime = Date.now();
    updateLevelDisplay();
    updateMultiplierDisplay();
    
    const previousNumSafes = state.safes.length;

    // Clear existing safes
    state.safes.forEach(s => s.destroy());
    state.safes.length = 0;
    
    // Robust cleanup: Remove any orphaned Safe groups from scene (e.g. from HMR or state desync)
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        if (child.userData.isSafe) {
            scene.remove(child);
            child.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry.dispose();
                    if (obj.material instanceof THREE.Material) {
                        obj.material.dispose();
                    } else if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    }
                }
            });
        }
    }

    // Remove any temp objects (treasure or overlays)
    scene.children.forEach(child => {
        if (child.userData.isTreasure) {
            scene.remove(child);
        }
    });

    // Clean up camera children (overlays)
    for (let i = camera.children.length - 1; i >= 0; i--) {
        const child = camera.children[i];
        if (child.userData.isOverlay) {
            camera.remove(child);
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (child.material instanceof THREE.Material) child.material.dispose();
            }
        }
    }

    // Reset lights/background
    resetSceneLighting();

    // Update info
    const info = document.getElementById('info');
    if (info) {
        info.innerText = "Loading level...";
        info.style.color = "yellow";
    }

    // Generate Level
    let numSafes;
    do {
        numSafes = Math.floor(Math.random() * (7 - 3 + 1)) + 3; // 3 to 7
    } while (numSafes === previousNumSafes);

    // Initial mock service call
    try {
        await mockService.initLevel(numSafes, state.level);
    } catch (error) {
        console.error("Failed to init level:", error);
        // Fallback or retry? For now, we continue but server might be out of sync
    }

    if (info) {
        info.innerText = "Choose a safe to open...";
        info.style.color = "white";
    }

    state.isProcessing = false; // Unblock input

    // Calculate positions
    const layouts: Record<number, number[]> = {
        3: [3],
        4: [2, 2],
        5: [3, 2],
        6: [3, 3],
        7: [3, 2, 2]
    };
    const rowConfig = layouts[numSafes];
    const rowSpacing = 2.5; // Vertical spacing
    const colSpacing = 3.5; // Horizontal spacing
    
    const totalHeight = (rowConfig.length - 1) * rowSpacing;
    let currentY = totalHeight / 2; // Center vertically

    let globalIndex = 0;
    for (const count of rowConfig) {
        const rowWidth = (count - 1) * colSpacing;
        let currentX = -rowWidth / 2;
        
        for (let r = 0; r < count; r++) {
            const safe = new Safe(globalIndex, currentX, currentY);
            // Add gold to safe (now all safes have gold)
            safe.addGold();
            
            state.safes.push(safe);
            currentX += colSpacing;
            globalIndex++;
        }
        currentY -= rowSpacing;
    }

    // Adjust Camera based on number of safes
    const maxCols = 3; 
    const numRows = rowConfig.length;
    
    const requiredWidth = maxCols * 4.0;
    const requiredHeight = numRows * 3.5;
    
    const aspect = window.innerWidth / window.innerHeight;
    const distW = requiredWidth / (2 * Math.tan(THREE.MathUtils.degToRad(75 / 2)) * aspect);
    const distH = requiredHeight / (2 * Math.tan(THREE.MathUtils.degToRad(75 / 2)));
    
    const targetZ = Math.max(6, distW, distH);
    
    new TWEEN.Tween(camera.position)
        .to({ z: targetZ, y: 2 }, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
            camera.lookAt(0, 0, 0);
        })
        .start();
}

export function winLevel(safe: Safe, prize: number) {
    soundManager.play('win');
    const info = document.getElementById('info');
    // Prize passed from server check
    // Delay score update to match particle animation (1.2s)
    setTimeout(() => {
        setScore(state.score + prize);
        updateScoreDisplay();
    }, 1200);

    // Spawn sparks
    // Gold is approximately at safe.group.position + (0, 0.1, 0)
    // We can just use the safe position as a good enough start point
    const startPos = safe.group.position.clone().add(new THREE.Vector3(0, 0.1, 0));
    particleManager.spawnSparks(startPos, 'score');

    if (info) {
        info.innerText = `Safe! +${prize.toFixed(2)} Points`;
        info.style.color = "#44ff44";
    }

    // Next level after delay (increased to allow score update to be seen)
    setTimeout(() => {
        state.level++;
        startLevel();
    }, 2500);
}

export function loseGame() {
    // Alarm sounds, game over. No leaderboard entry on loss.
    soundManager.play('lose');
    soundManager.stop('bgm');

    const info = document.getElementById('info');
    if (info) info.innerText = "ALARM WHEN OFF! GAME OVER";

    const cashOutBtn = document.getElementById('btn-cash-out');
    if (cashOutBtn) {
        cashOutBtn.classList.add('hidden');
    }

    // Change lights to red
    ambientLight.color.setHex(0xff0000);
    pointLight.color.setHex(0xff0000);

    // Blink lights
    new TWEEN.Tween(pointLight)
        .to({ intensity: 0 }, 200)
        .yoyo(true)
        .repeat(20)
        .start();

    // Create red overlay for blinking alpha effect
    const overlayGeo = new THREE.PlaneGeometry(50, 50); // Big enough to cover view
    const overlayMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthTest: false // Ensure it draws on top
    });
    const overlay = new THREE.Mesh(overlayGeo, overlayMat);
    overlay.position.z = -2; // In front of camera
    overlay.userData.isOverlay = true;
    camera.add(overlay);
    
    if (scene.children.indexOf(camera) === -1) {
        scene.add(camera);
    }

    // Blink the overlay opacity
    new TWEEN.Tween(overlayMat)
        .to({ opacity: 0 }, 200)
        .yoyo(true)
        .repeat(20)
        .start();

    // Shake camera
    new TWEEN.Tween(camera.position)
        .to({ x: camera.position.x + 0.5 }, 50)
        .yoyo(true)
        .repeat(10)
        .start();

    setTimeout(() => {
        showMainScreen();
    }, 3000);
}

export async function handleSafeClick(safe: Safe) {
    if (safe.isOpened) return;
    
    soundManager.play('click');
    soundManager.play('drill');
    state.isProcessing = true; // Lock input
    safe.open(); // Visual open starts immediately

    // Perform check against mock server
    try {
        const result = await mockService.checkSafe(safe.index);
        
        soundManager.stop('drill');
        if (result.isBad) {
            loseGame();
        } else {
            winLevel(safe, result.prize);
        }
    } catch (error) {
        console.error("Error checking safe:", error);
        // Handle error gracefully? For now just reset processing
        soundManager.stop('drill');
        state.isProcessing = false;
    }
}

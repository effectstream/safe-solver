import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { state, setScore, resetState } from './GameState';
import { Safe } from './Safe';
import { scene, camera, ambientLight, pointLight, resetSceneLighting } from './Scene';
import { leaderboard } from './EffectStreamLeaderboard';
import { getConnectedWallet, getLocalWallet } from './EffectStreamWallet';
import { showCustomAlert } from './Utils';
import { soundManager } from './SoundManager';
import { effectStreamService } from './EffectStreamService';
import { particleManager } from './ParticleManager';

export function updateScoreDisplay() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.innerText = `Score: ${state.score.toFixed(2)}`;

    const cashOutBtn = document.getElementById('btn-cash-out');
    if (cashOutBtn) {
        if (state.score > 0) {
            cashOutBtn.classList.remove('hidden');
        } else {
            cashOutBtn.classList.add('hidden');
        }
    }
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

    // Hide tokens display and button as per new requirements
    if (tokensEl) {
        tokensEl.style.display = 'none';
    }

    if (addTokensBtn) {
        addTokensBtn.style.display = 'none';
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
    leaderboard.fetchData();
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
    // Score starts at 0
    state.score = 0;

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
    // cashOutBtn visibility handled by updateScoreDisplay (initially hidden if score 0)
    if (multBadge) multBadge.classList.remove('hidden');

    await startLevel();
}

export async function cashOut() {
    if (state.isDemo) {
        showCustomAlert(`Demo Game Over! You would have won ${state.score.toFixed(2)} tokens.`);
    } else {
        soundManager.play('cashout');
        const wallet = getConnectedWallet();
        const localWallet = getLocalWallet();
        const address = wallet?.walletAddress || localWallet?.walletAddress;
        
        let accountId: number | undefined;

        if (address) {
            try {
                const info = await effectStreamService.getAddressInfo(address);
                if (info && info.account_id) {
                    accountId = info.account_id;
                }
            } catch (e) {
                console.warn("Failed to fetch account info for cashout", e);
            }
        }
        
        if (accountId !== undefined) {
             // Use the async addScore from leaderboard which calls EffectStreamService
             effectStreamService.submitScore(accountId).then(() => {
                  leaderboard.render();
             });
             showCustomAlert(`Cashed Out! +${state.score.toFixed(2)} Tokens`);
        } else {
            console.error("Could not find account ID for cashout");
            showCustomAlert("Error cashing out: Account not found");
        }

        // No longer adding tokens locally, assume submitted score handles it
        updateTokenDisplay();
    }
    showMainScreen();
}

export async function startLevel(numSafesOverride?: number) {
    state.isProcessing = true; // Block input while loading
    state.levelStartTime = Date.now();
    updateLevelDisplay();
    updateMultiplierDisplay();
    
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

    let numSafes = 3;

    // Check if we can continue an ongoing game first
    try {
        const wallet = getConnectedWallet();
        const localWallet = getLocalWallet();
        const address = wallet?.walletAddress || localWallet?.walletAddress;
        if (address) {
            const gameState = await effectStreamService.getGameState(address);
            if (gameState && gameState.is_ongoing) {
                console.log("Resuming ongoing game...", gameState);
                state.level = gameState.round;
                state.score = gameState.current_score || 0;
                numSafes = gameState.safe_count || 3;
                updateLevelDisplay();
                updateScoreDisplay();
                updateMultiplierDisplay();
                // Skip initLevel since game is ongoing
            } else if (state.level === 1) {
                // No ongoing game, start new one
                // Initial Level: Generate random safes locally or fixed?
                // Prompt said "When initLevel is called also add a random hash..."
                // We need to call initLevel for level 1.
                
                // Initial mock service call only for start
                try {
                    await effectStreamService.initLevel();
                    // Re-fetch state to get safe count if needed, though we default to 3 or random
                    const newGameState = await effectStreamService.getGameState(address);
                     if (newGameState && newGameState.safe_count) {
                        numSafes = newGameState.safe_count;
                    }
                } catch (error) {
                    console.error("Failed to init level:", error);
                }
            } else {
                 // Level > 1 and not resuming (should be covered by else block logic or parameter override)
            }
        }
    } catch (e) {
        console.error("Error checking game state:", e);
    }
    
    // If not level 1 and we are here, we might be advancing levels in a session
    if (state.level > 1 && !numSafesOverride) {
        // Fallback or use override
         // We should have received numSafes from previous checkSafe response
    }
    
    if (numSafesOverride) {
        numSafes = numSafesOverride;
    } else if (state.level > 1 && !numSafes) { 
          // If we are here and numSafes is still 3 (default) but level > 1, 
          // and we didn't resume, we might need to randomize or we are in trouble.
          // Let's assume the previous logic holds if not resuming.
           numSafes = Math.floor(Math.random() * (7 - 3 + 1)) + 3;
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
    const rowConfig = layouts[numSafes] || layouts[3];
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

export function winLevel(safe: Safe, prize: number, nextSafeCount?: number) {
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
        startLevel(nextSafeCount);
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

    const cashOutBtn = document.getElementById('btn-cash-out');
    if (cashOutBtn) cashOutBtn.classList.add('hidden');
    
    soundManager.play('click');
    soundManager.play('drill');
    state.isProcessing = true; // Lock input
    safe.open(); // Visual open starts immediately

    // Perform check against mock server
    try {
        const result = await effectStreamService.checkSafe(safe.index);
        
        soundManager.stop('drill');
        if (result.isBad) {
            loseGame();
        } else {
            winLevel(safe, result.prize, result.nextSafeCount);
        }
    } catch (error) {
        console.error("Error checking safe:", error);
        // Handle error gracefully? For now just reset processing
        soundManager.stop('drill');
        state.isProcessing = false;
    }
}

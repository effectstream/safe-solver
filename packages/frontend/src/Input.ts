import * as THREE from 'three';
import { state } from './GameState';
import { camera, scene, renderer } from './Scene';
import { Safe } from './Safe';
import { handleSafeClick } from './GameLogic';

const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

export function initInput() {
    // Listen on the canvas element instead of window for better control
    // But since canvas might not be in DOM when initInput is called (if called before initScene finishes appending), 
    // it's safer to listen on window/document but calculate relative to canvas.
    // Actually, initScene appends it. initInput is called after initScene in main.ts.
    // Let's stick to window but check target or bounds.
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
}

function getSafeFromIntersect(intersects: THREE.Intersection[]): Safe | null {
    if (intersects.length === 0) return null;

    // Sort intersects by distance to handle cases where ray passes through multiple objects
    intersects.sort((a, b) => a.distance - b.distance);

    // Check only the first (closest) intersection
    let object = intersects[0].object;
    
    // Traverse up to find the safe group
    while(object.parent && object !== scene) {
        const found = state.safes.find(s => s.group === object.parent);
        if (found) return found;
        object = object.parent;
    }
    return null;
}

function updateCoordinates(clientX: number, clientY: number) {
    if (!renderer.domElement) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    
    // Check if mouse/touch is inside the canvas
    if (clientX < rect.left || clientX > rect.right ||
        clientY < rect.top || clientY > rect.bottom) {
        // Optional: could handle out of bounds
    }

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function updateMouseCoordinates(event: MouseEvent) {
    updateCoordinates(event.clientX, event.clientY);
}

function onMouseMove(event: MouseEvent) {
    if (state.isProcessing) return;
    if (event.target !== renderer.domElement) return;

    updateMouseCoordinates(event);

    raycaster.setFromCamera(mouse, camera);

    const intersectObjects: THREE.Object3D[] = [];
    state.safes.forEach(safe => intersectObjects.push(safe.group));
    const intersects = raycaster.intersectObjects(intersectObjects, true);

    const safe = getSafeFromIntersect(intersects);

    if (safe !== state.hoveredSafe) {
        if (state.hoveredSafe) state.hoveredSafe.setHighlight(false);
        state.hoveredSafe = safe;
        if (state.hoveredSafe) state.hoveredSafe.setHighlight(true);
    }
}

function onMouseClick(event: MouseEvent) {
    if (state.isProcessing) return;
    if (event.target !== renderer.domElement) return;

    // Prevent clicks for 100 milliseconds after level start
    if (Date.now() - state.levelStartTime < 100) return;

    updateMouseCoordinates(event);

    raycaster.setFromCamera(mouse, camera);

    const intersectObjects: THREE.Object3D[] = [];
    state.safes.forEach(safe => intersectObjects.push(safe.group));
    const intersects = raycaster.intersectObjects(intersectObjects, true);

    const safe = getSafeFromIntersect(intersects);

    if (safe) {
        handleSafeClick(safe);
    }
}

function onTouchStart(event: TouchEvent) {
    if (state.isProcessing) return;
    if (event.target !== renderer.domElement) return;

    // Prevent clicks for 100 milliseconds after level start
    if (Date.now() - state.levelStartTime < 100) return;

    if (event.touches.length > 0) {
        const touch = event.touches[0];
        updateCoordinates(touch.clientX, touch.clientY);

        raycaster.setFromCamera(mouse, camera);

        const intersectObjects: THREE.Object3D[] = [];
        state.safes.forEach(safe => intersectObjects.push(safe.group));
        const intersects = raycaster.intersectObjects(intersectObjects, true);

        const safe = getSafeFromIntersect(intersects);

        if (safe) {
            // Prevent default behavior to stop mouse emulation and scrolling if we hit a safe
            event.preventDefault();
            handleSafeClick(safe);
        }
    }
}

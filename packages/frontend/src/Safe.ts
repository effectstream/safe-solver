import * as THREE from 'three';
import { scene } from './Scene';

// Shared texture for the dial
let sharedDialTexture: THREE.CanvasTexture | null = null;

function getDialTexture(): THREE.CanvasTexture {
    if (sharedDialTexture) return sharedDialTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 512, 512);

        // Center
        const cx = 256;
        const cy = 256;
        const radius = 240;

        // Ticks and Numbers
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const numTicks = 40;
        for (let i = 0; i < numTicks; i++) {
            const angle = (i / numTicks) * Math.PI * 2;
            // Canvas rotation is clockwise, 0 at 3 o'clock?
            // Usually 0 at 3 o'clock.
            // We want 0 at top ( -PI/2 ).
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle - Math.PI / 2);
            ctx.translate(0, -radius + 40); // Move to edge

            // Tick
            ctx.lineWidth = (i % 5 === 0) ? 6 : 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, (i % 5 === 0) ? 30 : 15);
            ctx.stroke();

            // Number for every 5th tick
            if (i % 5 === 0) {
                 ctx.translate(0, 50);
                 ctx.rotate(-(angle - Math.PI / 2)); // Rotate text back to be upright
                 ctx.font = 'bold 42px Arial';
                 ctx.fillText(i.toString(), 0, 0);
            }
            
            ctx.restore();
        }
    }

    sharedDialTexture = new THREE.CanvasTexture(canvas);
    sharedDialTexture.colorSpace = THREE.SRGBColorSpace;
    return sharedDialTexture;
}

export class Safe {
    group: THREE.Group;
    doorGroup: THREE.Group;
    bodyGroup: THREE.Group;
    bodyMeshes: THREE.Mesh[];
    doorMesh: THREE.Mesh;
    dialGroup: THREE.Group;
    dialMeshes: THREE.Mesh[] = [];
    
    isOpened: boolean = false;
    index: number;

    // Animation properties
    private isAnimating: boolean = false;
    private animationTime: number = 0;
    private animationDuration: number = 1.0; // seconds
    private startRotation: number = 0;
    private targetRotation: number = 0;

    constructor(index: number, x: number, y: number) {
        this.targetRotation = Math.PI / 2;
        this.index = index;
        this.group = new THREE.Group();
        this.group.userData.isSafe = true;
        this.group.position.set(x, y, 0);

        // Rotate slightly towards center
        // If x < 0 (left), rotate Y positive (towards center/right)
        // If x > 0 (right), rotate Y negative (towards center/left)
        this.group.rotation.y = -x * 0.1;

        // Body Group (Hollow Box)
        this.bodyGroup = new THREE.Group();
        this.group.add(this.bodyGroup);
        this.bodyMeshes = [];

        const size = 1.5;
        const thickness = 0.1;
        const halfSize = size / 2;
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const darkInsideMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const createWall = (w: number, h: number, d: number, px: number, py: number, pz: number, mat: THREE.Material = bodyMat) => {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px, py, pz);
            this.bodyGroup.add(mesh);
            this.bodyMeshes.push(mesh);
        };

        // Back
        createWall(size, size, thickness, 0, 0.75, -halfSize + thickness/2, darkInsideMat);
        // Floor
        createWall(size, thickness, size, 0, 0.75 - halfSize + thickness/2, 0, darkInsideMat);
        // Ceiling
        createWall(size, thickness, size, 0, 0.75 + halfSize - thickness/2, 0);
        // Left
        createWall(thickness, size, size, -halfSize + thickness/2, 0.75, 0);
        // Right
        createWall(thickness, size, size, halfSize - thickness/2, 0.75, 0);

        // Door Group
        this.doorGroup = new THREE.Group();
        // Pivot at front-right corner (0.75, 0.75, 0.75)
        this.doorGroup.position.set(0.75, 0.75, 0.75); 
        this.group.add(this.doorGroup);

        // Door Mesh
        const doorGeo = new THREE.BoxGeometry(1.4, 1.4, 0.1);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });
        this.doorMesh = new THREE.Mesh(doorGeo, doorMat);
        this.doorMesh.position.set(-0.75, 0, 0); 
        this.doorGroup.add(this.doorMesh);

        // --- New Round Handle (Dial) ---
        this.dialGroup = new THREE.Group();
        // Position on the door face. Door face is at local Z=0 relative to doorMesh? 
        // No, doorMesh is at (-0.75, 0, 0) relative to doorGroup.
        // doorMesh geometry has thickness 0.1. So face is at +/- 0.05 from its center.
        // We want to attach to doorGroup, so we position relative to it.
        // Center of door is (-0.75, 0, 0). Front face is z = +0.05.
        this.dialGroup.position.set(-0.75, 0, 0.05);
        this.doorGroup.add(this.dialGroup);

        // 1. Base Ring (Silver)
        const ringGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.05, 32);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.z = 0.025; // Sit on top of door
        this.dialGroup.add(ringMesh);
        this.dialMeshes.push(ringMesh);

        // 2. Dial Face (Black with Numbers)
        const dialGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
        dialGeo.rotateX(Math.PI / 2);
        
        // Materials for Cylinder: [side, top, bottom]
        // Top face is index 1.
        const dialSideMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        const dialFaceMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            map: getDialTexture(),
            roughness: 0.5 
        });
        
        const dialMesh = new THREE.Mesh(dialGeo, [dialSideMat, dialFaceMat, dialSideMat]);
        dialMesh.position.z = 0.055; // Slightly in front of ring
        // Rotate Z so numbers are upright? Texture generation handles upright numbers.
        this.dialGroup.add(dialMesh);
        this.dialMeshes.push(dialMesh);

        // 3. Central Knob
        const knobGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 16);
        knobGeo.rotateX(Math.PI / 2);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });
        const knobMesh = new THREE.Mesh(knobGeo, knobMat);
        knobMesh.position.z = 0.1;
        this.dialGroup.add(knobMesh);
        this.dialMeshes.push(knobMesh);

        scene.add(this.group);
    }

    open() {
        if (this.isOpened) return;
        
        this.isOpened = true;
        this.isAnimating = true;
        this.animationTime = 0;
        this.startRotation = this.doorGroup.rotation.y;
    }

    update(dt: number) {
        if (!this.isAnimating) return;

        this.animationTime += dt;
        let t = Math.min(this.animationTime / this.animationDuration, 1.0);
        
        // Quadratic Out Easing
        const ease = -t * (t - 2);
        
        const newRot = this.startRotation + (this.targetRotation - this.startRotation) * ease;
        this.doorGroup.rotation.y = newRot;

        if (t >= 1.0) {
            this.isAnimating = false;
        }
    }

    setHighlight(highlight: boolean) {
        const color = highlight ? 0x444444 : 0x000000;
        
        this.bodyMeshes.forEach(mesh => {
            (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(color);
        });

        (this.doorMesh.material as THREE.MeshStandardMaterial).emissive.setHex(color);
        
        // Highlight dial too?
        // Maybe just the ring
        if (this.dialMeshes.length > 0) {
             (this.dialMeshes[0].material as THREE.MeshStandardMaterial).emissive.setHex(highlight ? 0x222222 : 0x000000);
        }
    }

    destroy() {
        scene.remove(this.group);
        this.bodyMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.doorMesh.geometry.dispose();
        (this.doorMesh.material as THREE.Material).dispose();

        this.dialMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                (mesh.material as THREE.Material).dispose();
            }
        });
    }

    addGold() {
        const goldGroup = new THREE.Group();
        // Random dimensions for variety
        const barWidth = 0.4;
        const barHeight = 0.1;
        const barDepth = 0.8;
        
        const barGeo = new THREE.BoxGeometry(barWidth, barHeight, barDepth);
        
        // Cel shading style: MeshToonMaterial
        // Golder color: Richer yellow-orange
        const barMat = new THREE.MeshToonMaterial({ 
            color: 0xffcc00, 
            emissive: 0xffaa00,
            emissiveIntensity: 0.2,
        });

        // Edges geometry for outlining (black aristas)
        const edgesGeo = new THREE.EdgesGeometry(barGeo);
        const edgesMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        
        // Add outlining (optional, but enhances cel shading)
        // For simple cel shading, just the material is often enough, 
        // but let's stick to the requested material change first.

        const numBars = Math.floor(Math.random() * 8) + 3; // 3 to 10 bars
        
        // Simple stacking logic
        // 2 columns roughly centered
        const spacingX = 0.5;
        
        for (let i = 0; i < numBars; i++) {
            const bar = new THREE.Mesh(barGeo, barMat);

            // Add the black outline
            const edges = new THREE.LineSegments(edgesGeo, edgesMat);
            bar.add(edges);
            
            // Determine position
            // Alternating columns or pyramid?
            // Let's do a messy stack
            
            const level = Math.floor(i / 2);
            const col = i % 2;
            
            // Base positions
            let x = (col === 0 ? -1 : 1) * (spacingX / 2);
            let y = level * barHeight + (barHeight / 2); // Center Y
            let z = 0;

            // Add randomness
            x += (Math.random() - 0.5) * 0.1;
            z += (Math.random() - 0.5) * 0.2;
            
            // Random rotation around Y for "messy" look
            bar.rotation.y = (Math.random() - 0.5) * 0.3;

            bar.position.set(x, y, z);
            goldGroup.add(bar);
        }
        
        // Adjust group position to sit on floor of safe
        // Safe floor top is at y = 0.1
        goldGroup.position.set(0, 0.1, 0); 
        this.group.add(goldGroup);
    }
}

import * as THREE from 'three';
import { camera } from './Scene';
import { mouse } from './Input';

export class Drill {
    mesh: THREE.Group;
    bodyGroup: THREE.Group;
    headGroup: THREE.Group; // Chuck and bit
    distance: number = 3; // Closer to camera for better view

    constructor() {
        this.mesh = new THREE.Group();

        // Materials
        const plasticMat = new THREE.MeshStandardMaterial({ 
            color: 0xff4500, // Industrial Orange
            roughness: 0.6,
            metalness: 0.1
        });
        const darkMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, // Dark grip
            roughness: 0.9,
            metalness: 0.1
        });
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0xdddddd,
            roughness: 0.3,
            metalness: 0.8
        });

        // --- Body Group ---
        this.bodyGroup = new THREE.Group();
        this.mesh.add(this.bodyGroup);

        // Handle (Grip)
        const handleGeo = new THREE.BoxGeometry(0.25, 1.0, 0.4);
        const handle = new THREE.Mesh(handleGeo, darkMat);
        handle.position.y = -0.5;
        handle.rotation.x = 0.2; // Slight angle
        this.bodyGroup.add(handle);

        // Motor Housing (Main body)
        const housingGeo = new THREE.BoxGeometry(0.4, 0.5, 1.2);
        const housing = new THREE.Mesh(housingGeo, plasticMat);
        housing.position.y = 0.2;
        housing.position.z = -0.2; // Shift back a bit
        this.bodyGroup.add(housing);

        // Back cap
        const capGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const cap = new THREE.Mesh(capGeo, darkMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(0, 0.2, 0.4);
        this.bodyGroup.add(cap);

        // --- Head Group (Rotating parts) ---
        this.headGroup = new THREE.Group();
        // Position head at front of housing
        this.headGroup.position.set(0, 0.2, -0.8); 
        this.mesh.add(this.headGroup);

        // Chuck (The part that holds the bit)
        const chuckGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 16);
        const chuck = new THREE.Mesh(chuckGeo, darkMat);
        chuck.rotation.x = Math.PI / 2;
        this.headGroup.add(chuck);

        // Drill Bit
        // Use a cylinder with fewer segments to make rotation visible, or a spiral
        const bitGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6); // Hexagonal bit
        const bit = new THREE.Mesh(bitGeo, metalMat);
        bit.rotation.x = Math.PI / 2;
        bit.position.z = -0.9; // Extend forward from chuck
        this.headGroup.add(bit);

        // Spiral detail (creating a helical effect using multiple torus segments)
        const spiralGeo = new THREE.TorusGeometry(0.055, 0.008, 5, 8); 
        const numSpirals = 16;
        const startZ = -0.4;
        const endZ = -1.4;
        
        for (let i = 0; i < numSpirals; i++) {
            const t = i / numSpirals;
            const z = startZ + (endZ - startZ) * t;
            
            const spiral = new THREE.Mesh(spiralGeo, darkMat);
            spiral.position.z = z;
            
            // Tilt to look like threads
            spiral.rotation.x = Math.PI / 6; 
            spiral.rotation.y = Math.PI / 6;
            
            // Rotate around axis to align the low-poly segments in a spiral pattern
            spiral.rotation.z = t * Math.PI * 4; 
            
            this.headGroup.add(spiral);
        }

        // Orientation of the whole drill
        // We want it pointing UP and IN.
        // Currently built along -Z (pointing forward).
        this.mesh.rotation.x = Math.PI / 8; // Tilt up 22.5 degrees (lower angle)

        // Add to camera
        camera.add(this.mesh);
    }

    update() {
        // Calculate visible bounds at the drill's distance
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * this.distance;
        const width = height * camera.aspect;

        // Position at bottom of screen
        this.mesh.position.z = -this.distance;
        this.mesh.position.x = mouse.x * (width / 2);
        this.mesh.position.y = (mouse.y * 0.4) + (-height / 2 - 0.5); // Offset to show it

        // Rotate the head (bit + chuck)
        // Rotating around Z axis of the headGroup (which points forward because we built it along Z)
        // Wait, we built objects rotated Math.PI/2 on X. 
        // Chuck is Cylinder(..., rotation.x = PI/2). Its local Y axis points along World Z.
        // Actually, let's look at headGroup.
        // We added chuck (rotated) and bit (rotated).
        // It is cleaner to rotate the headGroup itself.
        // The headGroup is at (0, 0.2, -0.8). 
        // Objects inside are aligned along Z.
        // So we should rotate the objects inside, or rotate the group.
        // If we rotate the group around Z, it will spin correctly if the objects are centered on Z.
        // They are centered on X=0, Y=0 (relative to headGroup), extending along Z.
        // Yes, they are.
        
        this.headGroup.rotation.z += 0.5; // High speed rotation
        
        // Add some vibration
        this.mesh.position.x += (Math.random() - 0.5) * 0.02;
        this.mesh.position.y += (Math.random() - 0.5) * 0.02;
    }
}

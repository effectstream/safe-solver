import * as THREE from 'three';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
export const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
export const pointLight = new THREE.PointLight(0xffffff, 1);
export let backgroundTexture: THREE.Texture;

export function initScene(onTextureLoad?: () => void) {
    const textureLoader = new THREE.TextureLoader();
    backgroundTexture = textureLoader.load('/img.png', () => {
        if (onTextureLoad) onTextureLoad();
    });
    scene.background = backgroundTexture;

    camera.position.set(0, 2, 10);

    const container = document.getElementById('game-view');
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        document.body.appendChild(renderer.domElement);
    }

    scene.add(ambientLight);

    pointLight.position.set(5, 10, 10);
    scene.add(pointLight);

    scene.add(camera);
}

export function resetSceneLighting() {
    scene.background = backgroundTexture;
    ambientLight.color.setHex(0xffffff);
    ambientLight.intensity = 0.5;
    pointLight.color.setHex(0xffffff);
    pointLight.intensity = 1;
}

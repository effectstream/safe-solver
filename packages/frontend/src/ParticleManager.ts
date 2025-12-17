import * as THREE from 'three';
import { camera } from './Scene';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

class ParticleManager {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private particles: Particle[] = [];
    private width: number = window.innerWidth;
    private height: number = window.innerHeight;

    constructor() {
        // Defer initialization to avoid DOM issues
    }

    public init() {
        const container = document.getElementById('game-view');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-overlay';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000'; 
        
        if (container) {
            container.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }

        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get 2d context for particles');
        this.ctx = context;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    private resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (parent) {
            this.width = parent.clientWidth;
            this.height = parent.clientHeight;
        } else {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    public spawnSparks(worldPos: THREE.Vector3, targetElementId: string, count: number = 20) {
        if (!this.ctx || !this.canvas) return;
        // 1. Convert World Position to Screen Position
        const screenPos = worldPos.clone().project(camera);
        
        // Convert from normalized device coordinates (-1 to +1) to screen coordinates
        const startX = (screenPos.x * 0.5 + 0.5) * this.width;
        const startY = (-(screenPos.y * 0.5) + 0.5) * this.height;

        // 2. Get Target Element Position
        const targetEl = document.getElementById(targetElementId);
        if (!targetEl) return;

        const rect = targetEl.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const targetX = (rect.left - canvasRect.left) + rect.width / 2;
        const targetY = (rect.top - canvasRect.top) + rect.height / 2;

        for (let i = 0; i < count; i++) {
            // Initial velocity bursting out
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            
            this.particles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 0.8 + Math.random() * 0.4, // seconds (shorter)
                color: `hsl(${40 + Math.random() * 20}, 100%, 50%)`, // Gold/Yellow
                size: Math.random() * 3 + 2,
                // We'll store target info in the particle closure or just calculate direction every frame?
                // For a simple "move to target", let's use a homing behavior or simple interpolation.
                // Let's attach target to the particle loosely by properties if needed, 
                // but for now let's just make them fly out then lerp to target.
            });

            // Hacky: Attach target info to particle by extending the object dynamically if needed, 
            // or just handle "flying to target" logic in update.
            // Let's add extra props to the particle for the "homing" phase
            (this.particles[this.particles.length - 1] as any).targetX = targetX;
            (this.particles[this.particles.length - 1] as any).targetY = targetY;
        }
    }

    public update(dt: number) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const pTarget = p as any;

            p.life += dt;

            // Phase 1: Explosion (first 30% of life)
            // Phase 2: Move to target (remaining life)
            
            if (p.life < p.maxLife * 0.3) {
                p.x += p.vx;
                p.y += p.vy;
                // Gravity
                p.vy += 20 * dt; 
                // Drag
                p.vx *= 0.95;
                p.vy *= 0.95;
            } else {
                // Homing phase
                
                // Interpolate from current pos to target? 
                // Better: Update velocity towards target
                const dx = pTarget.targetX - p.x;
                const dy = pTarget.targetY - p.y;
                
                p.x += dx * 8 * dt; // Faster homing
                p.y += dy * 8 * dt;

                // Shrink as it gets closer
                p.size = Math.max(0, p.size - 8 * dt);
            }

            if (p.life >= p.maxLife || p.size <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

export const particleManager = new ParticleManager();


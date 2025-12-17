export class SoundManager {
    private sounds: Record<string, HTMLAudioElement> = {};
    private muted: boolean = false;

    constructor() {
        this.loadSounds();
    }

    private loadSounds() {
        const soundFiles = {
            'click': '/click.wav',
            'win': '/win.wav',
            'lose': '/lose.wav',
            'cashout': '/cashout.wav',
            'bgm': '/bgm.wav',
            'drill': '/drill.wav'
        };

        for (const [key, path] of Object.entries(soundFiles)) {
            const audio = new Audio(path);
            if (key === 'bgm') {
                audio.loop = true;
                audio.volume = 0.5;
            } else if (key === 'lose') {
                audio.volume = 0.5;
            }
            this.sounds[key] = audio;
        }
    }

    public play(key: string) {
        if (this.muted) return;
        
        const sound = this.sounds[key];
        if (sound) {
            // Reset time to allow rapid replay
            if (key !== 'bgm') {
                sound.currentTime = 0;
            }
            sound.play().catch(e => {
                console.warn(`Error playing sound ${key}:`, e);
                if (e.name === 'NotSupportedError') {
                     console.warn(`File might be missing or format unsupported: ${sound.src}`);
                }
            });
        }
    }

    public stop(key: string) {
        const sound = this.sounds[key];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    public toggleMute() {
        this.muted = !this.muted;
        // Handle BGM immediately
        if (this.muted) {
            this.sounds['bgm']?.pause();
        } else {
            this.sounds['bgm']?.play().catch(() => {});
        }
        return this.muted;
    }

    public isMuted() {
        return this.muted;
    }
}

export const soundManager = new SoundManager();


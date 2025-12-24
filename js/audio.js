/**
 * SNAKE KILLER - Audio System
 * Synthesized sound effects using Web Audio API
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('snakeKiller_sound') !== 'false';
        this.initialized = false;

        // Volume master
        this.masterVolume = 0.3;
    }

    /**
     * Initialize Audio Context on user gesture
     */
    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            console.log("Audio Initialized");
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    /**
     * Resume context if suspended (browser auto-lock)
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('snakeKiller_sound', this.enabled);
        return this.enabled;
    }

    /**
     * Play a sound effect
     * @param {string} type - 'shoot', 'hit', 'powerup', 'levelup' 
     */
    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        switch (type) {
            case 'shoot':
                this.shootSound();
                break;
            case 'hit':
                this.hitSound();
                break;
            case 'powerup':
                this.powerupSound();
                break;
            case 'levelup':
                this.levelUpSound();
                break;
        }
    }

    // --- Sound Synthesis ---

    shootSound() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        // Pitch drop
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        // Volume envelope
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    hitSound() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        // Low thump
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(this.masterVolume * 0.8, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    powerupSound() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        // Ascending slide
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    levelUpSound() {
        // Simple arpeggio
        this.playTone(440, 0, 0.2); // A4
        this.playTone(554, 0.1, 0.2); // C#5
        this.playTone(659, 0.2, 0.4); // E5
    }

    playTone(freq, startTime, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime + startTime;
        osc.type = 'square';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }
}

/**
 * SNAKE KILLER - Audio System
 * Synthesized sound effects using Web Audio API
 * 
 * iOS Safari Compatibility:
 * - Audio context starts suspended and must be resumed on user gesture
 * - Context resume is asynchronous and must complete before playing sounds
 * - A silent buffer must be played to fully unlock audio on some iOS versions
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('snakeKiller_sound') !== 'false';
        this.initialized = false;
        this.unlocked = false; // iOS unlock state

        // Volume master
        this.masterVolume = 0.3;
    }

    /**
     * Initialize Audio Context on user gesture
     * Must be called from a touch/click event handler
     */
    init() {
        if (this.initialized) return;

        try {
            // Use webkit prefix for older iOS Safari
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.initialized = true;
            console.log("Audio Context Created, state:", this.ctx.state);

            // Immediately try to unlock for iOS
            this.unlock();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    /**
     * Unlock audio context for iOS Safari
     * iOS requires a user gesture to start audio, and some versions
     * require playing a silent buffer to fully unlock
     */
    unlock() {
        if (!this.ctx || this.unlocked) return;

        // Resume context if suspended
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                console.log("Audio Context Resumed");
                this.playUnlockSound();
            }).catch(e => {
                console.warn("Audio resume failed:", e);
            });
        } else {
            this.playUnlockSound();
        }
    }

    /**
     * Play a silent/minimal sound to fully unlock iOS audio
     * This ensures the audio context is truly active
     */
    playUnlockSound() {
        if (!this.ctx || this.unlocked) return;

        try {
            // Create a very short, silent oscillator
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            // Set gain to near-zero (silent)
            gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.01);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.01);

            this.unlocked = true;
            console.log("Audio Unlocked for iOS");
        } catch (e) {
            console.warn("Unlock sound failed:", e);
        }
    }

    /**
     * Resume context if suspended (browser auto-lock)
     * Returns a promise for async handling
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            return this.ctx.resume();
        }
        return Promise.resolve();
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
     * Ensures context is active before playing (iOS fix)
     * @param {string} type - 'shoot', 'hit', 'powerup', 'levelup', 'switch'
     */
    play(type) {
        if (!this.enabled || !this.ctx) return;

        // Check if context is suspended (can happen on iOS after tab switch)
        if (this.ctx.state === 'suspended') {
            // Try to resume and play - async but best effort
            this.ctx.resume().then(() => {
                this._playSound(type);
            }).catch(() => {
                // Silently fail - will work on next user gesture
            });
        } else {
            this._playSound(type);
        }
    }

    /**
     * Internal method to play the actual sound
     * @param {string} type - Sound type
     */
    _playSound(type) {
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
            case 'switch':
                this.switchSound();
                break;
            // === NEW: Ally sounds ===
            case 'allySpawn':
                this.allySpawnSound();
                break;
            case 'allyDespawn':
                this.allyDespawnSound();
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

    /**
     * Weapon switch sound - quick rising click
     */
    switchSound() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        // Quick rising tone
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);

        // Short, snappy envelope
        gain.gain.setValueAtTime(this.masterVolume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    /**
     * === NEW: Ally spawn sound - parachute whoosh + landing thud ===
     */
    allySpawnSound() {
        // Whoosh sound (descending noise)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);

        osc1.type = 'sawtooth';
        // Descending whoosh
        osc1.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.4);

        gain1.gain.setValueAtTime(this.masterVolume * 0.3, this.ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc1.start();
        osc1.stop(this.ctx.currentTime + 0.4);

        // Landing thud (delayed)
        setTimeout(() => {
            if (!this.ctx || this.ctx.state === 'closed') return;

            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

            gain2.gain.setValueAtTime(this.masterVolume * 0.5, this.ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc2.start();
            osc2.stop(this.ctx.currentTime + 0.15);
        }, 350);
    }

    /**
     * === NEW: Ally despawn sound - teleport/fade effect ===
     */
    allyDespawnSound() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        // Ascending fade-out
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(this.masterVolume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }
}

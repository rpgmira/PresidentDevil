// ============================================
// President Devil — Procedural Audio System
// All sounds generated via Web Audio API — no files needed
// ============================================

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.enabled = false;
        this.musicPlaying = null;
        this.musicNodes = [];
        this.heartbeatInterval = null;
        this.ambienceNodes = [];
        this.footstepTimer = 0;
        this.lastFootstepTime = 0;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.25;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);

            this.enabled = true;
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ═══════════════════════════════════════
    // SFX — Short procedural sound effects
    // ═══════════════════════════════════════

    _playTone(freq, duration, type = 'square', gainVal = 0.3, destination = null) {
        if (!this.enabled) return;
        const dest = destination || this.sfxGain;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoise(duration, gainVal = 0.2, filterFreq = 2000, destination = null) {
        if (!this.enabled) return;
        const dest = destination || this.sfxGain;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        source.start(this.ctx.currentTime);
    }

    // --- Player footsteps ---
    playFootstep() {
        if (!this.enabled) return;
        const now = this.ctx.currentTime;
        if (now - this.lastFootstepTime < 0.25) return; // rate limit
        this.lastFootstepTime = now;
        // Soft thud
        this._playNoise(0.06, 0.08, 400);
        this._playTone(80 + Math.random() * 40, 0.05, 'sine', 0.06);
    }

    // --- Enemy footsteps (heavier) ---
    playEnemyFootstep() {
        if (!this.enabled) return;
        this._playNoise(0.08, 0.04, 300);
    }

    // --- Melee hit ---
    playMeleeHit(weaponName) {
        if (!this.enabled) return;
        if (weaponName === 'Chainsaw') {
            // Buzzy chainsaw grind
            this._playTone(120, 0.15, 'sawtooth', 0.25);
            this._playTone(125, 0.15, 'sawtooth', 0.2);
            this._playNoise(0.1, 0.15, 3000);
        } else if (weaponName === 'Knife') {
            // Quick slash
            this._playNoise(0.05, 0.15, 5000);
            this._playTone(800, 0.04, 'sine', 0.1);
        } else if (weaponName === 'Baseball Bat') {
            // Thwack
            this._playNoise(0.08, 0.2, 1000);
            this._playTone(150, 0.1, 'triangle', 0.15);
        } else {
            // Fist punch
            this._playNoise(0.05, 0.12, 600);
            this._playTone(100, 0.06, 'sine', 0.1);
        }
    }

    // --- Ranged weapon fire ---
    playGunshot(weaponName) {
        if (!this.enabled) return;
        if (weaponName === 'Shotgun') {
            this._playNoise(0.15, 0.35, 3000);
            this._playTone(80, 0.1, 'sawtooth', 0.2);
        } else if (weaponName === 'Crossbow') {
            // Twang
            this._playTone(600, 0.08, 'triangle', 0.15);
            this._playTone(400, 0.12, 'sine', 0.1);
        } else if (weaponName === 'Grenade') {
            // Pin pull + toss
            this._playTone(1200, 0.03, 'sine', 0.1);
            this._playNoise(0.05, 0.08, 2000);
        } else {
            // Handgun
            this._playNoise(0.1, 0.25, 4000);
            this._playTone(120, 0.06, 'sawtooth', 0.15);
        }
    }

    // --- Explosion (grenade) ---
    playExplosion() {
        if (!this.enabled) return;
        this._playNoise(0.4, 0.4, 1500);
        this._playTone(60, 0.3, 'sine', 0.3);
        this._playTone(40, 0.5, 'sine', 0.2);
    }

    // --- Pickup item ---
    playPickup() {
        if (!this.enabled) return;
        this._playTone(440, 0.08, 'sine', 0.15);
        setTimeout(() => this._playTone(660, 0.08, 'sine', 0.15), 60);
    }

    // --- Open door ---
    playDoorOpen() {
        if (!this.enabled) return;
        this._playNoise(0.15, 0.1, 800);
        this._playTone(200, 0.2, 'triangle', 0.08);
    }

    // --- Door sealed (panic) ---
    playDoorSeal() {
        if (!this.enabled) return;
        this._playTone(150, 0.4, 'sawtooth', 0.2);
        this._playTone(100, 0.6, 'sine', 0.15);
        this._playNoise(0.3, 0.15, 600);
    }

    // --- Weapon break ---
    playWeaponBreak() {
        if (!this.enabled) return;
        this._playNoise(0.12, 0.25, 2000);
        this._playTone(200, 0.15, 'sawtooth', 0.15);
        this._playTone(100, 0.2, 'square', 0.1);
    }

    // --- Enemy hurt ---
    playEnemyHurt() {
        if (!this.enabled) return;
        this._playTone(300 + Math.random() * 200, 0.06, 'sawtooth', 0.1);
    }

    // --- Enemy death ---
    playEnemyDeath() {
        if (!this.enabled) return;
        this._playTone(200, 0.15, 'sawtooth', 0.15);
        this._playTone(100, 0.25, 'sine', 0.1);
        this._playNoise(0.1, 0.1, 1000);
    }

    // --- Player hurt ---
    playPlayerHurt() {
        if (!this.enabled) return;
        this._playTone(250, 0.1, 'square', 0.2);
        this._playTone(180, 0.15, 'sawtooth', 0.15);
    }

    // --- Player death ---
    playPlayerDeath() {
        if (!this.enabled) return;
        this._playTone(300, 0.3, 'sawtooth', 0.2);
        this._playTone(150, 0.5, 'sawtooth', 0.15);
        this._playTone(80, 0.8, 'sine', 0.1);
    }

    // --- Inventory select ---
    playInventorySelect() {
        if (!this.enabled) return;
        this._playTone(500, 0.04, 'square', 0.08);
    }

    // --- Item drop ---
    playItemDrop() {
        if (!this.enabled) return;
        this._playTone(300, 0.06, 'triangle', 0.1);
        this._playTone(200, 0.08, 'triangle', 0.08);
    }

    // --- Jump scare stinger ---
    playJumpScare() {
        if (!this.enabled) return;
        this._playTone(800, 0.05, 'sawtooth', 0.35);
        this._playTone(1200, 0.08, 'square', 0.3);
        this._playNoise(0.15, 0.3, 6000);
        setTimeout(() => {
            this._playTone(100, 0.3, 'sine', 0.2);
        }, 80);
    }

    // --- Level up / evolution acquired ---
    playEvolution() {
        if (!this.enabled) return;
        this._playTone(330, 0.1, 'sine', 0.15);
        setTimeout(() => this._playTone(440, 0.1, 'sine', 0.15), 100);
        setTimeout(() => this._playTone(660, 0.15, 'sine', 0.2), 200);
    }

    // --- Panic wave incoming ---
    playPanicWave() {
        if (!this.enabled) return;
        this._playTone(100, 0.3, 'sawtooth', 0.2);
        this._playNoise(0.2, 0.15, 1000);
    }

    // ═══════════════════════════════════════
    // HEARTBEAT — intensifies with corruption
    // ═══════════════════════════════════════

    startHeartbeat(corruptionPercent) {
        if (!this.enabled) return;
        this.stopHeartbeat();

        // Rate: 60bpm at 0% corruption → 140bpm at 100%
        const bpm = 60 + corruptionPercent * 0.8;
        const interval = 60000 / bpm;
        // Volume: quiet at low corruption, loud at high
        const vol = 0.05 + corruptionPercent * 0.002;

        this.heartbeatInterval = setInterval(() => {
            if (!this.enabled) return;
            // Lub
            this._playTone(60, 0.08, 'sine', vol);
            // Dub (slightly delayed)
            setTimeout(() => {
                this._playTone(50, 0.06, 'sine', vol * 0.7);
            }, 120);
        }, interval);
    }

    updateHeartbeat(corruptionPercent) {
        // Restart with new parameters if corruption changes significantly
        if (this.heartbeatInterval) {
            this.stopHeartbeat();
            if (corruptionPercent > 15) {
                this.startHeartbeat(corruptionPercent);
            }
        } else if (corruptionPercent > 15) {
            this.startHeartbeat(corruptionPercent);
        }
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // ═══════════════════════════════════════
    // AMBIENT SOUNDSCAPE — low drones & hums
    // ═══════════════════════════════════════

    startAmbience() {
        if (!this.enabled) return;
        this.stopAmbience();

        // Low drone
        const drone = this.ctx.createOscillator();
        const droneGain = this.ctx.createGain();
        drone.type = 'sine';
        drone.frequency.value = 55; // low A
        droneGain.gain.value = 0.04;
        drone.connect(droneGain);
        droneGain.connect(this.musicGain);
        drone.start();
        this.ambienceNodes.push({ osc: drone, gain: droneGain });

        // Sub-bass pulse
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.value = 30;
        subGain.gain.value = 0.03;
        // LFO for pulsing
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15; // very slow pulse
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(subGain.gain);
        sub.connect(subGain);
        subGain.connect(this.musicGain);
        lfo.start();
        sub.start();
        this.ambienceNodes.push({ osc: sub, gain: subGain, lfo, lfoGain });

        // Filtered noise layer (distant hum)
        const noiseLen = 4;
        const bufferSize = this.ctx.sampleRate * noiseLen;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 200;
        noiseFilter.Q.value = 2;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.015;
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.musicGain);
        noiseSource.start();
        this.ambienceNodes.push({ source: noiseSource, gain: noiseGain, filter: noiseFilter });
    }

    stopAmbience() {
        for (const node of this.ambienceNodes) {
            try {
                if (node.osc) node.osc.stop();
                if (node.lfo) node.lfo.stop();
                if (node.source) node.source.stop();
            } catch (e) { /* already stopped */ }
        }
        this.ambienceNodes = [];
    }

    // ═══════════════════════════════════════
    // MUSIC — Exploration & Panic
    // ═══════════════════════════════════════

    startExplorationMusic() {
        if (!this.enabled) return;
        this.stopMusic();
        this.musicPlaying = 'exploration';

        // Minimal, tense — slow arpeggiated minor notes
        const notes = [55, 65.4, 73.4, 82.4, 73.4, 65.4]; // Am low register
        let noteIdx = 0;

        const playNote = () => {
            if (this.musicPlaying !== 'exploration' || !this.enabled) return;
            const freq = notes[noteIdx % notes.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 1.5);
            noteIdx++;
        };

        playNote();
        this._explorationInterval = setInterval(playNote, 2000);
    }

    startPanicMusic() {
        if (!this.enabled) return;
        this.stopMusic();
        this.musicPlaying = 'panic';

        // Chaotic, fast, dissonant
        const bassNotes = [55, 58.3, 51.9, 61.7]; // dissonant bass
        let noteIdx = 0;

        const playBeat = () => {
            if (this.musicPlaying !== 'panic' || !this.enabled) return;

            // Heavy bass hit
            const freq = bassNotes[noteIdx % bassNotes.length];
            this._playTone(freq, 0.15, 'sawtooth', 0.15, this.musicGain);
            // Percussive noise hit
            this._playNoise(0.05, 0.12, 3000, this.musicGain);

            // Occasional high stab
            if (noteIdx % 4 === 2) {
                this._playTone(freq * 8, 0.04, 'square', 0.08, this.musicGain);
            }
            noteIdx++;
        };

        playBeat();
        this._panicInterval = setInterval(playBeat, 250); // fast tempo ~240bpm
    }

    stopMusic() {
        this.musicPlaying = null;
        if (this._explorationInterval) {
            clearInterval(this._explorationInterval);
            this._explorationInterval = null;
        }
        if (this._panicInterval) {
            clearInterval(this._panicInterval);
            this._panicInterval = null;
        }
    }

    // ═══════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════

    stopAll() {
        this.stopMusic();
        this.stopHeartbeat();
        this.stopAmbience();
    }

    destroy() {
        this.stopAll();
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
        this.enabled = false;
    }
}

// Global audio manager instance
const AUDIO = new AudioManager();

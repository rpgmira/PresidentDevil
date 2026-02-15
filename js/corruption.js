// ============================================
// President Devil — Corruption / Noise System
// ============================================

class CorruptionSystem {
    constructor(scene) {
        this.scene = scene;
        this.value = 0; // 0 to CONFIG.CORRUPTION_MAX
        this.panicTriggered = false;
    }

    update(delta, player) {
        if (!player.alive) return;

        // Decay when not in combat / moving
        if (!player.moving && !player.isAttacking) {
            const decayMult = player.getPassiveMult ? player.getPassiveMult('corruptDecay') : 1;
            this.value -= CONFIG.CORRUPTION_DECAY_RATE * (delta / 1000) * 10 * decayMult;
        }

        this.value = Phaser.Math.Clamp(this.value, 0, CONFIG.CORRUPTION_MAX);

        // Update heartbeat intensity
        AUDIO.updateHeartbeat(this.value / CONFIG.CORRUPTION_MAX);

        // Screen distortion at high corruption
        const intensity = this.value / CONFIG.CORRUPTION_MAX;
        if (intensity > 0.5) {
            const shakeAmount = (intensity - 0.5) * 0.002;
            if (Math.random() < 0.02) {
                this.scene.cameras.main.shake(100, shakeAmount);
            }
        }

        // Check for panic event trigger
        if (this.value >= CONFIG.CORRUPTION_HORDE_THRESHOLD && !this.panicTriggered) {
            return true; // Signal to GameScene to trigger panic
        }

        return false;
    }

    add(amount) {
        this.value += amount;
        this.value = Math.min(this.value, CONFIG.CORRUPTION_MAX);
    }

    reduce(amount) {
        this.value -= amount;
        this.value = Math.max(this.value, 0);
    }

    getLevel() {
        // Returns difficulty multiplier based on corruption
        if (this.value < 20) return 1;
        if (this.value < 40) return 1.25;
        if (this.value < 60) return 1.5;
        if (this.value < 80) return 2;
        return 2.5;
    }

    resetPanicFlag() {
        this.panicTriggered = false;
    }

    setPanicTriggered() {
        this.panicTriggered = true;
    }
}

// ============================================
// President Devil — Particle Effects System
// Uses Phaser 3.60+ built-in ParticleEmitter for GPU-accelerated effects
// ============================================

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;

        // Generate tiny textures for particles (1-frame each)
        this._generateParticleTextures();

        // Create persistent emitters for frequent effects
        this._createEmitters();
    }

    _generateParticleTextures() {
        const scene = this.scene;
        const sizes = [
            { key: 'particle_2', size: 2 },
            { key: 'particle_3', size: 3 },
            { key: 'particle_4', size: 4 },
            { key: 'particle_6', size: 6 }
        ];

        for (const { key, size } of sizes) {
            if (scene.textures.exists(key)) continue;
            const gfx = scene.make.graphics({ add: false });
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRect(0, 0, size, size);
            gfx.generateTexture(key, size, size);
            gfx.destroy();
        }
    }

    _createEmitters() {
        // Blood emitter — reused for bloodSplatter calls
        this.bloodEmitter = this.scene.add.particles(0, 0, 'particle_2', {
            speed: { min: 20, max: 80 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 300, max: 800 },
            gravityY: 40,
            tint: CONFIG.COLORS.BLOOD,
            emitting: false
        });
        this.bloodEmitter.setDepth(2);

        // Death burst emitter — for larger blood chunks
        this.deathBurstEmitter = this.scene.add.particles(0, 0, 'particle_4', {
            speed: { min: 15, max: 45 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0.3 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 800,
            gravityY: 20,
            tint: 0xaa0000,
            emitting: false
        });
        this.deathBurstEmitter.setDepth(2);

        // Corruption wisps emitter
        this.corruptionEmitter = this.scene.add.particles(0, 0, 'particle_2', {
            speed: { min: 30, max: 70 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: { min: 500, max: 800 },
            gravityY: -15,
            tint: [0x8a1a3a, 0x661133, 0x993355, 0x440022],
            emitting: false
        });
        this.corruptionEmitter.setDepth(57);

        // Muzzle flash emitter
        this.muzzleEmitter = this.scene.add.particles(0, 0, 'particle_6', {
            speed: { min: 10, max: 30 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 80,
            tint: 0xffdd44,
            emitting: false
        });
        this.muzzleEmitter.setDepth(61);

        // Muzzle sparks emitter
        this.sparkEmitter = this.scene.add.particles(0, 0, 'particle_2', {
            speed: { min: 40, max: 80 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: { min: 120, max: 200 },
            tint: 0xffaa22,
            emitting: false
        });
        this.sparkEmitter.setDepth(61);

        // Hit spark emitter
        this.hitSparkEmitter = this.scene.add.particles(0, 0, 'particle_3', {
            speed: { min: 30, max: 60 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 100, max: 180 },
            tint: 0xffffff,
            emitting: false
        });
        this.hitSparkEmitter.setDepth(61);

        // Pickup sparkle emitter
        this.pickupEmitter = this.scene.add.particles(0, 0, 'particle_2', {
            speed: 25,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            gravityY: 30,
            emitting: false
        });
        this.pickupEmitter.setDepth(61);
    }

    // No per-frame update needed — Phaser handles it internally
    update(delta) {
        // Built-in emitters self-manage — no manual update required
    }

    // Blood splatter — on enemy hit/death
    bloodSplatter(x, y, count = 5) {
        this.bloodEmitter.emitParticleAt(x, y, count);
    }

    // Death burst — larger blood explosion
    deathBurst(x, y) {
        this.bloodSplatter(x, y, 12);
        this.deathBurstEmitter.emitParticleAt(x, y, 4);
    }

    // Corruption wisps — swirl around player at high corruption
    corruptionWisps(x, y, intensity) {
        const count = Math.ceil(intensity * 2);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 20;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            this.corruptionEmitter.emitParticleAt(px, py, 1);
        }
    }

    // Muzzle flash — brief bright flash at firing point
    muzzleFlash(x, y, angle) {
        const flashX = x + Math.cos(angle) * 8;
        const flashY = y + Math.sin(angle) * 8;

        this.muzzleEmitter.emitParticleAt(flashX, flashY, 1);

        // Sparks in firing direction
        const degAngle = Phaser.Math.RadToDeg(angle);
        this.sparkEmitter.setParticleAngle({ min: degAngle - 25, max: degAngle + 25 });
        this.sparkEmitter.emitParticleAt(flashX, flashY, 3);
    }

    // Hit spark — when projectile hits
    hitSpark(x, y) {
        this.hitSparkEmitter.emitParticleAt(x, y, 4);
    }

    // Item pickup sparkle
    pickupSparkle(x, y, color = 0xffffff) {
        this.pickupEmitter.setParticleTint(color);
        this.pickupEmitter.emitParticleAt(x, y, 6);
    }

    cleanup() {
        if (this.bloodEmitter) this.bloodEmitter.destroy();
        if (this.deathBurstEmitter) this.deathBurstEmitter.destroy();
        if (this.corruptionEmitter) this.corruptionEmitter.destroy();
        if (this.muzzleEmitter) this.muzzleEmitter.destroy();
        if (this.sparkEmitter) this.sparkEmitter.destroy();
        if (this.hitSparkEmitter) this.hitSparkEmitter.destroy();
        if (this.pickupEmitter) this.pickupEmitter.destroy();
    }
}

// ============================================
// President Devil — Particle Effects System
// ============================================

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                p.sprite.destroy();
                this.particles.splice(i, 1);
                continue;
            }

            // Move
            p.sprite.x += p.vx * (delta / 1000);
            p.sprite.y += p.vy * (delta / 1000);

            // Apply gravity if any
            p.vy += (p.gravity || 0) * (delta / 1000);

            // Fade
            const alpha = Math.min(1, p.life / p.fadeStart);
            p.sprite.setAlpha(alpha * p.startAlpha);

            // Shrink
            if (p.shrink) {
                const scale = p.life / p.maxLife;
                p.sprite.setScale(scale);
            }
        }
    }

    // Blood splatter — on enemy hit/death
    bloodSplatter(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 60;
            const size = 2 + Math.random() * 3;
            const life = 300 + Math.random() * 500;

            const sprite = this.scene.add.rectangle(x, y, size, size, CONFIG.COLORS.BLOOD);
            sprite.setDepth(2);
            sprite.setAlpha(0.8);

            this.particles.push({
                sprite,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life, maxLife: life,
                fadeStart: life * 0.5,
                startAlpha: 0.8,
                gravity: 40,
                shrink: true
            });
        }
    }

    // Death burst — larger blood explosion
    deathBurst(x, y) {
        this.bloodSplatter(x, y, 12);
        // Add some larger chunks
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 15 + Math.random() * 30;
            const size = 3 + Math.random() * 4;

            const sprite = this.scene.add.rectangle(x, y, size, size, 0xaa0000);
            sprite.setDepth(2);

            this.particles.push({
                sprite,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 800, maxLife: 800,
                fadeStart: 600,
                startAlpha: 0.9,
                gravity: 20,
                shrink: false
            });
        }
    }

    // Corruption wisps — swirl around player at high corruption
    corruptionWisps(x, y, intensity) {
        const count = Math.ceil(intensity * 2);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 8 + Math.random() * 20;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;

            const colors = [0x8a1a3a, 0x661133, 0x993355, 0x440022];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const sprite = this.scene.add.rectangle(px, py, 2, 2, color);
            sprite.setDepth(57);

            const orbitSpeed = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 40);
            this.particles.push({
                sprite,
                vx: Math.cos(angle + Math.PI / 2) * orbitSpeed,
                vy: Math.sin(angle + Math.PI / 2) * orbitSpeed,
                life: 500 + Math.random() * 300,
                maxLife: 800,
                fadeStart: 400,
                startAlpha: 0.6,
                gravity: -15,
                shrink: true
            });
        }
    }

    // Muzzle flash — brief bright flash at firing point
    muzzleFlash(x, y, angle) {
        const flashX = x + Math.cos(angle) * 8;
        const flashY = y + Math.sin(angle) * 8;

        const flash = this.scene.add.rectangle(flashX, flashY, 6, 6, 0xffdd44);
        flash.setDepth(61);
        flash.setAlpha(0.9);

        this.particles.push({
            sprite: flash,
            vx: Math.cos(angle) * 20,
            vy: Math.sin(angle) * 20,
            life: 80, maxLife: 80,
            fadeStart: 60,
            startAlpha: 0.9,
            shrink: true
        });

        // Sparks
        for (let i = 0; i < 3; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
            const spark = this.scene.add.rectangle(flashX, flashY, 2, 2, 0xffaa22);
            spark.setDepth(61);

            this.particles.push({
                sprite: spark,
                vx: Math.cos(sparkAngle) * (40 + Math.random() * 40),
                vy: Math.sin(sparkAngle) * (40 + Math.random() * 40),
                life: 120 + Math.random() * 80,
                maxLife: 200,
                fadeStart: 100,
                startAlpha: 0.8,
                shrink: true
            });
        }
    }

    // Hit spark — when projectile hits
    hitSpark(x, y) {
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sprite = this.scene.add.rectangle(x, y, 3, 3, 0xffffff);
            sprite.setDepth(61);

            this.particles.push({
                sprite,
                vx: Math.cos(angle) * (30 + Math.random() * 30),
                vy: Math.sin(angle) * (30 + Math.random() * 30),
                life: 100 + Math.random() * 80,
                maxLife: 180,
                fadeStart: 80,
                startAlpha: 0.9,
                shrink: true
            });
        }
    }

    // Item pickup sparkle
    pickupSparkle(x, y, color = 0xffffff) {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const sprite = this.scene.add.rectangle(x, y, 2, 2, color);
            sprite.setDepth(61);

            this.particles.push({
                sprite,
                vx: Math.cos(angle) * 25,
                vy: Math.sin(angle) * 25 - 15,
                life: 300, maxLife: 300,
                fadeStart: 200,
                startAlpha: 1,
                gravity: 30,
                shrink: true
            });
        }
    }

    cleanup() {
        for (const p of this.particles) {
            if (p.sprite) p.sprite.destroy();
        }
        this.particles = [];
    }
}

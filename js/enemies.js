// ============================================
// President Devil — Enemy System
// ============================================

class Enemy {
    constructor(scene, x, y, type, difficultyMult = 1) {
        this.scene = scene;
        this.type = type; // 'crawler', 'lurker', 'brute', 'shade', 'abomination'
        this.alive = true;

        // Generate enemy sprite textures if not yet done
        if (!scene.textures.exists('enemy_crawler')) {
            ENEMY_SPRITE_GEN.generate(scene);
        }

        const sizeMap = {
            crawler: CONFIG.TILE_SIZE - 4,
            lurker: CONFIG.TILE_SIZE - 2,
            brute: CONFIG.TILE_SIZE,
            shade: CONFIG.TILE_SIZE - 5,
            abomination: CONFIG.TILE_SIZE + 4
        };

        const size = sizeMap[type] || CONFIG.TILE_SIZE - 4;

        // Use sprite-based rendering
        const texKey = `enemy_${type}`;
        this.sprite = scene.add.sprite(
            x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            texKey, 'r0_f0'
        );
        this.sprite.setDepth(55);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setSize(size, size);
        this.sprite.body.setCollideWorldBounds(false);
        this.sprite.setData('enemy', this);

        const labelMap = {
            crawler: 'CRAWLER', lurker: 'LURKER', brute: 'BRUTE',
            shade: 'SHADE', abomination: '☠ ABOMINATION'
        };
        const labelColor = type === 'abomination' ? '#ff4444' : '#ffaaaa';
        this.label = scene.add.text(this.sprite.x, this.sprite.y - 12, labelMap[type] || type.toUpperCase(), {
            fontSize: type === 'abomination' ? '9px' : '8px',
            fill: labelColor,
            fontFamily: 'monospace',
            backgroundColor: '#000000',
            padding: { left: 1, right: 1, top: 0, bottom: 0 }
        }).setOrigin(0.5).setDepth(59);

        // Health bar
        const barWidth = type === 'abomination' ? 20 : 14;
        this._hpBarWidth = barWidth;
        this.hpBarBg = scene.add.rectangle(
            this.sprite.x, this.sprite.y - 8,
            barWidth, 2, 0x333333
        ).setOrigin(0.5).setDepth(58);
        this.hpBarFg = scene.add.rectangle(
            this.sprite.x, this.sprite.y - 8,
            barWidth, 2, 0x44cc44
        ).setOrigin(0.5).setDepth(59);

        // Stats based on type, scaled by difficulty
        const dm = difficultyMult;
        // Speed escalation: enemies start at half speed and scale up with difficulty
        const speedScale = dm;
        switch (type) {
            case 'crawler':
                this.hp = Math.floor(20 * dm);
                this.maxHp = this.hp;
                this.damage = Math.floor(8 * dm);
                this.speed = CONFIG.ENEMY_SPEED_PATROL * speedScale;
                this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * speedScale;
                this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE;
                this.xp = 5;
                break;
            case 'lurker':
                this.hp = Math.floor(35 * dm);
                this.maxHp = this.hp;
                this.damage = Math.floor(15 * dm);
                this.speed = CONFIG.ENEMY_SPEED_PATROL * 0.8 * speedScale;
                this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * 1.2 * speedScale;
                this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE * 1.3;
                this.xp = 10;
                break;
            case 'brute':
                this.hp = Math.floor(80 * dm);
                this.maxHp = this.hp;
                this.damage = Math.floor(25 * dm);
                this.speed = CONFIG.ENEMY_SPEED_PATROL * 0.5 * speedScale;
                this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * 0.6 * speedScale;
                this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE * 0.9;
                this.xp = 20;
                this.chargeTimer = 0;
                this.isCharging = false;
                break;
            case 'shade':
                this.hp = Math.floor(15 * dm);
                this.maxHp = this.hp;
                this.damage = Math.floor(12 * dm);
                this.speed = CONFIG.ENEMY_SPEED_PATROL * 1.5 * speedScale;
                this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * 1.8 * speedScale;
                this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE * 1.6;
                this.xp = 15;
                this.teleportCooldown = 0;
                break;
            case 'abomination':
                this.hp = Math.floor(200 * dm);
                this.maxHp = this.hp;
                this.damage = Math.floor(30 * dm);
                this.speed = CONFIG.ENEMY_SPEED_PATROL * 0.4 * speedScale;
                this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * 0.7 * speedScale;
                this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE * 2;
                this.xp = 50;
                this.chargeTimer = 0;
                this.isCharging = false;
                break;
            default:
                this.hp = 20; this.maxHp = 20; this.damage = 8;
                this.speed = CONFIG.ENEMY_SPEED_PATROL * speedScale;
                this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * speedScale;
                this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE;
                this.xp = 5;
        }

        // AI State
        this.state = 'patrol'; // patrol, chase, attack, stunned
        this.attackCooldown = 0;
        this.stunTimer = 0;

        // Noise attraction
        this.noiseTarget = null; // { x, y, intensity }
        this.noiseDecay = 0;

        // Patrol
        this.patrolTarget = null;
        this.patrolWaitTimer = 0;
        this.patrolRoom = null;

        // Start idle animation
        this._playEnemyAnim('idle');
    }

    update(delta, player, dungeon) {
        if (!this.alive) return;

        this.label.setPosition(this.sprite.x, this.sprite.y - 12);

        // Update health bar
        const hpRatio = Math.max(0, this.hp / this.maxHp);
        const barW = this._hpBarWidth * hpRatio;
        this.hpBarBg.setPosition(this.sprite.x, this.sprite.y - 7);
        this.hpBarFg.setPosition(
            this.sprite.x - (this._hpBarWidth - barW) / 2,
            this.sprite.y - 7
        );
        this.hpBarFg.width = barW;
        // Color: green > yellow > red
        if (hpRatio > 0.6) this.hpBarFg.setFillStyle(0x44cc44);
        else if (hpRatio > 0.3) this.hpBarFg.setFillStyle(0xcccc22);
        else this.hpBarFg.setFillStyle(0xcc2222);

        // Update animation based on state
        this._updateEnemyAnimation();

        if (this.stunTimer > 0) {
            this.stunTimer -= delta;
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= delta;

        // Decay noise attraction
        if (this.noiseDecay > 0) {
            this.noiseDecay -= delta;
            if (this.noiseDecay <= 0) {
                this.noiseTarget = null;
            }
        }

        const distToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        // State transitions
        if (distToPlayer < CONFIG.ENEMY_ATTACK_RANGE && this.attackCooldown <= 0) {
            this.state = 'attack';
        } else if (distToPlayer < this.detectionRange) {
            this.state = 'chase';
        } else if (this.noiseTarget) {
            this.state = 'investigate';
        } else {
            this.state = 'patrol';
        }

        // State behavior
        switch (this.state) {
            case 'patrol':
                this._patrol(delta, dungeon);
                break;
            case 'chase':
                this._chase(delta, player, dungeon);
                break;
            case 'attack':
                this._attack(player);
                break;
            case 'investigate':
                this._investigate(delta, dungeon);
                break;
        }
    }

    _patrol(delta, dungeon) {
        if (this.patrolWaitTimer > 0) {
            this.patrolWaitTimer -= delta;
            return;
        }

        if (!this.patrolTarget) {
            // Pick a random walkable tile nearby
            const tx = Math.floor(this.sprite.x / CONFIG.TILE_SIZE);
            const ty = Math.floor(this.sprite.y / CONFIG.TILE_SIZE);
            const dx = Phaser.Math.Between(-3, 3);
            const dy = Phaser.Math.Between(-3, 3);
            if (dungeon.isWalkable(tx + dx, ty + dy)) {
                this.patrolTarget = {
                    x: (tx + dx) * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    y: (ty + dy) * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
                };
            }
            return;
        }

        const dist = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.patrolTarget.x, this.patrolTarget.y
        );

        if (dist < 4) {
            this.patrolTarget = null;
            this.patrolWaitTimer = Phaser.Math.Between(500, 2000);
            return;
        }

        this._moveToward(this.patrolTarget.x, this.patrolTarget.y, this.speed, delta, dungeon);
    }

    _chase(delta, player, dungeon) {
        // Shade: teleport behind player when in range
        if (this.type === 'shade') {
            if (this.teleportCooldown !== undefined) this.teleportCooldown -= delta;
            const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.sprite.x, player.sprite.y);
            if (this.teleportCooldown <= 0 && dist < this.detectionRange * 0.6 && dist > CONFIG.ENEMY_ATTACK_RANGE * 2) {
                // Teleport to a tile near the player
                const angle = Phaser.Math.Angle.Between(player.sprite.x, player.sprite.y, this.sprite.x, this.sprite.y) + Math.PI;
                const tx = Math.floor((player.sprite.x + Math.cos(angle) * 24) / CONFIG.TILE_SIZE);
                const ty = Math.floor((player.sprite.y + Math.sin(angle) * 24) / CONFIG.TILE_SIZE);
                if (dungeon.isWalkable(tx, ty)) {
                    // Teleport effect at old position
                    if (this.scene.particles) this.scene.particles.deathBurst(this.sprite.x, this.sprite.y);
                    this.sprite.x = tx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                    this.sprite.y = ty * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                    if (this.scene.particles) this.scene.particles.hitSpark(this.sprite.x, this.sprite.y);
                    this.teleportCooldown = 4000;
                    return;
                }
            }
        }
        // Brute / Abomination: charge attack when close enough
        if ((this.type === 'brute' || this.type === 'abomination') && this.chargeTimer !== undefined) {
            this.chargeTimer -= delta;
            const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.sprite.x, player.sprite.y);
            if (!this.isCharging && this.chargeTimer <= 0 && dist < this.detectionRange * 0.5 && dist > CONFIG.ENEMY_ATTACK_RANGE * 2) {
                this.isCharging = true;
                this.chargeDirection = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, player.sprite.x, player.sprite.y);
                this.chargeDuration = 600;
                this.sprite.setTint(0xffaa00);
            }
            if (this.isCharging) {
                this.chargeDuration -= delta;
                const chargeSpeed = this.chaseSpeed * 3;
                const cvx = Math.cos(this.chargeDirection) * chargeSpeed * (delta / 1000);
                const cvy = Math.sin(this.chargeDirection) * chargeSpeed * (delta / 1000);
                const newX = this.sprite.x + cvx;
                const newY = this.sprite.y + cvy;
                const checkTX = Math.floor(newX / CONFIG.TILE_SIZE);
                const checkTY = Math.floor(newY / CONFIG.TILE_SIZE);
                if (dungeon.isWalkable(checkTX, checkTY)) {
                    this.sprite.x = newX;
                    this.sprite.y = newY;
                }
                if (this.chargeDuration <= 0) {
                    this.isCharging = false;
                    this.chargeTimer = this.type === 'abomination' ? 5000 : 6000;
                    this._restoreColor();
                }
                return;
            }
        }
        this._moveToward(player.sprite.x, player.sprite.y, this.chaseSpeed, delta, dungeon);
    }

    _investigate(delta, dungeon) {
        if (!this.noiseTarget) return;
        const dist = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.noiseTarget.x, this.noiseTarget.y
        );
        if (dist < 8) {
            this.noiseTarget = null;
            this.noiseDecay = 0;
            return;
        }
        this._moveToward(this.noiseTarget.x, this.noiseTarget.y, this.chaseSpeed * 0.7, delta, dungeon);
    }

    attractToNoise(x, y, intensity) {
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, x, y);
        const noiseRadius = intensity * 80; // intensity 1 = 80px, intensity 5 = 400px
        if (dist < noiseRadius && this.state === 'patrol') {
            this.noiseTarget = { x, y };
            this.noiseDecay = 3000 + intensity * 1000; // lasts 3-8 seconds
        }
    }

    _attack(player) {
        if (this.attackCooldown > 0) return;

        // Abomination slam: area damage + screen shake
        if (this.type === 'abomination') {
            player.takeDamage(this.damage);
            if (this.scene.cameras && this.scene.cameras.main) {
                this.scene.cameras.main.shake(200, 0.01);
            }
            if (this.scene.particles) {
                this.scene.particles.deathBurst(this.sprite.x, this.sprite.y);
            }
        } else {
            player.takeDamage(this.damage);
        }
        this.attackCooldown = CONFIG.ENEMY_ATTACK_COOLDOWN;

        // Visual feedback: flash + attack anim
        this.sprite.setTint(0xffffff);
        this._playEnemyAnim('attack');
        this.scene.time.delayedCall(100, () => {
            if (this.alive) this._restoreColor();
        });
    }

    _restoreColor() {
        if (this.sprite && this.sprite.clearTint) {
            this.sprite.clearTint();
        }
    }

    _moveToward(targetX, targetY, speed, delta, dungeon) {
        const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, targetX, targetY);
        const vx = Math.cos(angle) * speed * (delta / 1000);
        const vy = Math.sin(angle) * speed * (delta / 1000);

        const newX = this.sprite.x + vx;
        const newY = this.sprite.y + vy;

        const halfSize = (CONFIG.TILE_SIZE - 4) / 2;
        const tileX = Math.floor((newX + (vx > 0 ? halfSize : -halfSize)) / CONFIG.TILE_SIZE);
        const tileY = Math.floor((newY + (vy > 0 ? halfSize : -halfSize)) / CONFIG.TILE_SIZE);

        if (dungeon.isWalkable(tileX, Math.floor(this.sprite.y / CONFIG.TILE_SIZE))) {
            this.sprite.x = newX;
        }
        if (dungeon.isWalkable(Math.floor(this.sprite.x / CONFIG.TILE_SIZE), tileY)) {
            this.sprite.y = newY;
        }
    }

    takeDamage(amount) {
        if (!this.alive) return;

        this.hp -= amount;

        // Hit flash
        this.sprite.setTint(0xff4444);
        this._playEnemyAnim('hurt');
        this.scene.time.delayedCall(80, () => {
            if (this.alive) this._restoreColor();
        });

        // Knockback / stun
        this.stunTimer = 150;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;

        // Death burst particles
        if (this.scene.particles) {
            this.scene.particles.deathBurst(this.sprite.x, this.sprite.y);
        }

        // Leave blood stain
        const blood = this.scene.add.rectangle(
            this.sprite.x, this.sprite.y,
            CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4,
            CONFIG.COLORS.BLOOD
        );
        blood.setAlpha(0.5);
        blood.setDepth(0);

        // Animated death: shrink + fade out, then destroy
        this.label.destroy();
        if (this.hpBarBg) this.hpBarBg.destroy();
        if (this.hpBarFg) this.hpBarFg.destroy();
        this.sprite.setTint(0xff0000);
        this._playEnemyAnim('death');
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                if (this.sprite) this.sprite.destroy();
            }
        });
    }

    getWorldPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    _updateEnemyAnimation() {
        const prefix = `enemy_${this.type}`;
        switch (this.state) {
            case 'patrol':
            case 'investigate':
                this._playEnemyAnim('move');
                break;
            case 'chase':
                this._playEnemyAnim('move');
                break;
            case 'attack':
                // attack anim is triggered in _attack(), just let it play
                break;
            default:
                this._playEnemyAnim('idle');
        }
    }

    _playEnemyAnim(animName) {
        const key = `enemy_${this.type}_${animName}`;
        if (this.sprite && this.sprite.anims && this.sprite.anims.currentAnim?.key !== key) {
            this.sprite.play(key, true);
        }
    }
}

// ============================================
// Enemy Spawner
// ============================================

class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
    }

    spawnInRoom(room, count, type, difficultyMult) {
        const dm = difficultyMult || 1;
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
            const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);
            // Choose type based on weighting if not specified
            let chosenType = type;
            if (!chosenType) {
                const roll = Math.random();
                if (roll < 0.45) chosenType = 'crawler';
                else if (roll < 0.75) chosenType = 'lurker';
                else if (roll < 0.90) chosenType = 'brute';
                else chosenType = 'shade';
            }
            const enemy = new Enemy(this.scene, x, y, chosenType, dm);
            enemy.patrolRoom = room;
            this.enemies.push(enemy);
        }
    }

    spawnMiniBoss(room, difficultyMult) {
        const cx = room.x + Math.floor(room.width / 2);
        const cy = room.y + Math.floor(room.height / 2);
        const dm = difficultyMult || 1;
        const boss = new Enemy(this.scene, cx, cy, 'abomination', dm);
        boss.patrolRoom = room;
        this.enemies.push(boss);
        return boss;
    }

    spawnAtPosition(x, y, type, difficultyMult) {
        const enemy = new Enemy(this.scene, x, y, type, difficultyMult || 1);
        this.enemies.push(enemy);
        return enemy;
    }

    update(delta, player, dungeon) {
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                enemy.update(delta, player, dungeon);
            }
        }
    }

    getAliveEnemies() {
        return this.enemies.filter(e => e.alive);
    }

    getEnemiesInRange(x, y, range) {
        return this.enemies.filter(e => {
            if (!e.alive) return false;
            const dist = Phaser.Math.Distance.Between(x, y, e.sprite.x, e.sprite.y);
            return dist <= range;
        });
    }

    cleanup() {
        this.enemies = this.enemies.filter(e => e.alive);
    }

    broadcastNoise(x, y, intensity) {
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                enemy.attractToNoise(x, y, intensity);
            }
        }
    }
}

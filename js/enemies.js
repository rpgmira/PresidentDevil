// ============================================
// President Devil — Enemy System
// ============================================

class Enemy {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.type = type; // 'crawler' or 'lurker'
        this.alive = true;

        const color = type === 'crawler' ? CONFIG.COLORS.ENEMY_CRAWLER : CONFIG.COLORS.ENEMY_LURKER;
        const size = type === 'lurker' ? CONFIG.TILE_SIZE - 2 : CONFIG.TILE_SIZE - 4;

        this.sprite = scene.add.rectangle(
            x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            size, size, color
        );
        this.sprite.setDepth(55);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(false);
        this.sprite.setData('enemy', this);
        this.label = scene.add.text(this.sprite.x, this.sprite.y - 12, type === 'crawler' ? 'CRAWLER' : 'LURKER', {
            fontSize: '8px',
            fill: '#ffaaaa',
            fontFamily: 'monospace',
            backgroundColor: '#000000',
            padding: { left: 1, right: 1, top: 0, bottom: 0 }
        }).setOrigin(0.5).setDepth(59);

        // Stats based on type
        if (type === 'crawler') {
            this.hp = 20;
            this.maxHp = 20;
            this.damage = 8;
            this.speed = CONFIG.ENEMY_SPEED_PATROL;
            this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE;
            this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE;
            this.xp = 5;
        } else { // lurker
            this.hp = 35;
            this.maxHp = 35;
            this.damage = 15;
            this.speed = CONFIG.ENEMY_SPEED_PATROL * 0.8;
            this.chaseSpeed = CONFIG.ENEMY_SPEED_CHASE * 1.2;
            this.detectionRange = CONFIG.ENEMY_DETECTION_RANGE * 1.3;
            this.xp = 10;
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

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(delta, player, dungeon) {
        if (!this.alive) return;

        this.label.setPosition(this.sprite.x, this.sprite.y - 12);

        this.animTimer += delta;
        if (this.animTimer > 300) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
            // Simple animation: slight size pulse
            const baseSize = this.type === 'lurker' ? CONFIG.TILE_SIZE - 2 : CONFIG.TILE_SIZE - 4;
            const scale = this.animFrame === 0 ? 1 : 0.9;
            this.sprite.setSize(baseSize * scale, baseSize * scale);
        }

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

        player.takeDamage(this.damage);
        this.attackCooldown = CONFIG.ENEMY_ATTACK_COOLDOWN;

        // Visual feedback: flash
        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.alive) {
                const color = this.type === 'crawler' ? CONFIG.COLORS.ENEMY_CRAWLER : CONFIG.COLORS.ENEMY_LURKER;
                this.sprite.setFillStyle(color);
            }
        });
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
        this.sprite.setFillStyle(0xff4444);
        this.scene.time.delayedCall(80, () => {
            if (this.alive) {
                const color = this.type === 'crawler' ? CONFIG.COLORS.ENEMY_CRAWLER : CONFIG.COLORS.ENEMY_LURKER;
                this.sprite.setFillStyle(color);
            }
        });

        // Knockback / stun
        this.stunTimer = 150;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        // Leave blood stain
        const blood = this.scene.add.rectangle(
            this.sprite.x, this.sprite.y,
            CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4,
            CONFIG.COLORS.BLOOD
        );
        blood.setAlpha(0.5);
        blood.setDepth(0);

        this.label.destroy();
        this.sprite.destroy();
    }

    getWorldPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
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

    spawnInRoom(room, count, type) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
            const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);
            const enemy = new Enemy(this.scene, x, y, type || (Math.random() < 0.7 ? 'crawler' : 'lurker'));
            enemy.patrolRoom = room;
            this.enemies.push(enemy);
        }
    }

    spawnAtPosition(x, y, type) {
        const enemy = new Enemy(this.scene, x, y, type);
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

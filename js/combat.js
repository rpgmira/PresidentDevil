// ============================================
// President Devil — Combat System
// ============================================

class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];

        // Generate projectile textures for pooling
        this._generateProjectileTextures();

        // Create a physics group pool for projectiles (max 50 active at once)
        this.projectilePool = scene.physics.add.group({
            defaultKey: 'projectile_bullet',
            maxSize: 50,
            active: false,
            visible: false
        });
    }

    _generateProjectileTextures() {
        if (this.scene.textures.exists('projectile_bullet')) return;
        const gfx = this.scene.make.graphics({ add: false });
        gfx.fillStyle(0xffaa44, 1);
        gfx.fillRect(0, 0, 4, 4);
        gfx.generateTexture('projectile_bullet', 4, 4);
        gfx.destroy();
    }

    update(delta, player, enemyManager, corruption) {
        if (!player.alive) return;

        // Auto-melee: attack nearest enemy within range
        this._autoMelee(delta, player, enemyManager, corruption);

        // Handle ranged shooting (mouse click)
        this._handleRanged(delta, player, enemyManager, corruption);

        // Update projectiles
        this._updateProjectiles(delta, enemyManager, corruption);
    }

    _autoMelee(delta, player, enemyManager, corruption) {
        if (player.meleeCooldown > 0) return;

        const pos = player.getWorldPosition();
        const nearbyEnemies = enemyManager.getEnemiesInRange(
            pos.x, pos.y, CONFIG.PLAYER_MELEE_RANGE
        );

        if (nearbyEnemies.length === 0) return;

        // Find closest enemy
        let closest = null;
        let closestDist = Infinity;
        for (const enemy of nearbyEnemies) {
            const dist = Phaser.Math.Distance.Between(
                pos.x, pos.y, enemy.sprite.x, enemy.sprite.y
            );
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }

        if (!closest) return;

        // Face the nearest enemy when attacking
        const angle = Phaser.Math.Angle.Between(pos.x, pos.y, closest.sprite.x, closest.sprite.y);
        const absCos = Math.abs(Math.cos(angle));
        const absSin = Math.abs(Math.sin(angle));
        if (absCos >= absSin) {
            player.facing = Math.cos(angle) > 0 ? 'right' : 'left';
        } else {
            player.facing = Math.sin(angle) > 0 ? 'down' : 'up';
        }

        // Show attack effect in the direction of attack
        player._showAttackEffect(player.facing, 400);

        // Deal damage (with passive melee multiplier)
        const weapon = player.meleeWeapon;
        const meleeDmg = Math.floor(weapon.damage * player.getPassiveMult('meleeDamage'));
        closest.takeDamage(meleeDmg);
        AUDIO.playMeleeHit(weapon.name);
        player.meleeCooldown = weapon.speed * player.getPassiveMult('meleeSpeed');
        player.stats.damageDealt += meleeDmg;
        player.isAttacking = true;

        // Corruption gain (with passive multiplier)
        corruption.add(weapon.corruption * player.getPassiveMult('corruption'));

        // Durability loss (2x drain during panic events)
        if (player.activeMeleeSlot >= 0) {
            const item = player.inventory[player.activeMeleeSlot];
            if (item && item.durability !== Infinity) {
                const drain = this.scene.panicState && this.scene.panicState.active ? 2 : 1;
                item.durability -= drain;
                if (item.durability <= 0) {
                    item.durability = 0;
                    // Weapon breaks — auto-fallback to fists
                    AUDIO.playWeaponBreak();
                    player.activeMeleeSlot = -1;
                    player.meleeWeapon = CONFIG.WEAPONS.FISTS;
                }
            }
        }

        // Visual: attack indicator
        this._showMeleeEffect(pos, closest);

        // Blood particles
        if (this.scene.particles) {
            this.scene.particles.bloodSplatter(closest.sprite.x, closest.sprite.y, 4);
        }

        // Noise attraction — melee weapons generate noise
        if (this.scene.enemyManager.broadcastNoise) {
            this.scene.enemyManager.broadcastNoise(pos.x, pos.y, weapon.corruption);
        }

        // Check if enemy died
        if (!closest.alive) {
            player.stats.enemiesKilled++;
        }

        // Evolution: heal on melee hit
        if (this.scene.panicState && this.scene.panicState.healOnMelee) {
            player.heal(this.scene.panicState.healOnMelee);
        }

        // Reset attack animation after brief delay
        this.scene.time.delayedCall(150, () => {
            player.isAttacking = false;
        });
    }

    _handleRanged(delta, player, enemyManager, corruption) {
        if (!player.rangedWeapon) return;
        if (player.rangedCooldown > 0) return;
        if (!this.scene.input.activePointer.isDown) return;

        const weapon = player.rangedWeapon;
        const pos = player.getWorldPosition();

        // Check ammo
        const ammoSlot = this._findAmmo(player, weapon);
        if (ammoSlot === -1 && !weapon.consumable) return;

        // Consume ammo
        if (ammoSlot >= 0) {
            const ammoItem = player.inventory[ammoSlot];
            ammoItem.count--;
            if (ammoItem.count <= 0) {
                player.inventory[ammoSlot] = null;
            }
        }

        // If consumable (grenade), consume the weapon itself
        if (weapon.consumable) {
            player.inventory[player.activeRangedSlot] = null;
            player.activeRangedSlot = -1;
            player.rangedWeapon = null;
        }

        // Get aim direction from mouse
        const worldPoint = this.scene.cameras.main.getWorldPoint(
            this.scene.input.activePointer.x,
            this.scene.input.activePointer.y
        );
        const angle = Phaser.Math.Angle.Between(pos.x, pos.y, worldPoint.x, worldPoint.y);

        // Fire projectile(s)
        if (weapon.spread) {
            // Shotgun spread
            const spreadAngle = 0.3; // radians
            for (let i = 0; i < weapon.spread; i++) {
                const bulletAngle = angle + (i - (weapon.spread - 1) / 2) * spreadAngle;
                this._spawnProjectile(pos.x, pos.y, bulletAngle, weapon);
            }
            AUDIO.playGunshot(weapon.name);
            if (this.scene.particles) this.scene.particles.muzzleFlash(pos.x, pos.y, angle);
        } else if (weapon.aoeRadius) {
            // Grenade
            AUDIO.playExplosion();
            this._spawnGrenade(pos.x, pos.y, worldPoint.x, worldPoint.y, weapon);
        } else {
            // Single projectile
            AUDIO.playGunshot(weapon.name);
            this._spawnProjectile(pos.x, pos.y, angle, weapon);
            if (this.scene.particles) this.scene.particles.muzzleFlash(pos.x, pos.y, angle);
        }

        player.rangedCooldown = weapon.speed;
        corruption.add(weapon.corruption * player.getPassiveMult('corruption'));

        // Ranged noise — attracts enemies
        if (this.scene.enemyManager.broadcastNoise) {
            this.scene.enemyManager.broadcastNoise(pos.x, pos.y, weapon.corruption);
        }
    }

    _findAmmo(player, weapon) {
        const ammoTypeMap = {
            'Handgun': 'ammo_pistol',
            'Shotgun': 'ammo_shotgun',
            'Crossbow': 'ammo_crossbow'
        };
        const neededType = ammoTypeMap[weapon.name];
        if (!neededType) return -1;

        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (item && item.type === neededType && item.count > 0) {
                return i;
            }
        }
        return -1;
    }

    _spawnProjectile(x, y, angle, weapon) {
        const speed = 200;

        // Get a recycled sprite from the pool
        const projectile = this.projectilePool.get(x, y, 'projectile_bullet');
        if (!projectile) return; // Pool full

        projectile.setActive(true);
        projectile.setVisible(true);
        projectile.setPosition(x, y);
        projectile.body.enable = true;
        projectile.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        this.projectiles.push({
            sprite: projectile,
            damage: weapon.damage,
            range: weapon.range,
            startX: x,
            startY: y,
            alive: true
        });
    }

    _spawnGrenade(x, y, targetX, targetY, weapon) {
        const grenade = this.scene.add.rectangle(x, y, 6, 6, 0x44aa44);
        this.scene.physics.add.existing(grenade);

        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const dist = Math.min(Phaser.Math.Distance.Between(x, y, targetX, targetY), weapon.range);

        grenade.body.setVelocity(
            Math.cos(angle) * 150,
            Math.sin(angle) * 150
        );

        // Explode after reaching target
        this.scene.time.delayedCall(dist / 150 * 1000, () => {
            this._explode(grenade.x, grenade.y, weapon);
            grenade.destroy();
        });
    }

    _explode(x, y, weapon) {
        // Visual explosion
        const explosion = this.scene.add.circle(x, y, weapon.aoeRadius, 0xff6600, 0.7);
        this.scene.time.delayedCall(200, () => {
            explosion.setAlpha(0.3);
            this.scene.time.delayedCall(100, () => explosion.destroy());
        });

        // Damage all enemies in radius
        const enemies = this.scene.enemyManager.getEnemiesInRange(x, y, weapon.aoeRadius);
        for (const enemy of enemies) {
            enemy.takeDamage(weapon.damage);
            if (!enemy.alive) {
                this.scene.player.stats.enemiesKilled++;
            }
        }

        // Screen shake
        this.scene.cameras.main.shake(200, 0.01);
    }

    _showMeleeEffect(playerPos, enemy) {
        const midX = (playerPos.x + enemy.sprite.x) / 2;
        const midY = (playerPos.y + enemy.sprite.y) / 2;
        const effect = this.scene.add.rectangle(midX, midY, 8, 8, 0xffffff);
        effect.setAlpha(0.8);
        this.scene.time.delayedCall(100, () => effect.destroy());
    }

    _updateProjectiles(delta, enemyManager) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (!proj.alive) {
                // Return to pool instead of destroying
                this._recycleProjectile(proj);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check range
            const dist = Phaser.Math.Distance.Between(
                proj.startX, proj.startY,
                proj.sprite.x, proj.sprite.y
            );
            if (dist > proj.range) {
                proj.alive = false;
                continue;
            }

            // Check wall collision
            const tileX = Math.floor(proj.sprite.x / CONFIG.TILE_SIZE);
            const tileY = Math.floor(proj.sprite.y / CONFIG.TILE_SIZE);
            if (!this.scene.dungeon.isWalkable(tileX, tileY)) {
                proj.alive = false;
                continue;
            }

            // Enemy collision is handled by Phaser physics.overlap callback
            // (set up in GameScene.create via _onProjectileHitEnemy)
        }
    }

    _recycleProjectile(proj) {
        if (proj.sprite) {
            proj.sprite.setActive(false);
            proj.sprite.setVisible(false);
            if (proj.sprite.body) {
                proj.sprite.body.setVelocity(0, 0);
                proj.sprite.body.enable = false;
            }
        }
    }

    cleanup() {
        for (const proj of this.projectiles) {
            this._recycleProjectile(proj);
        }
        this.projectiles = [];
    }
}

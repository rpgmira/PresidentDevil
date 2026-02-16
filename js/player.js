// ============================================
// President Devil — Player Controller
// ============================================

class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Generate sprite texture if not yet generated
        if (!scene.textures.exists('player_sprite')) {
            SPRITE_GEN.generate(scene);
        }

        // Create player sprite from generated spritesheet
        this.sprite = scene.add.sprite(
            x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            'player_sprite',
            'r0_f0'
        );
        this.sprite.setDepth(60);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setSize(CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2);
        this.sprite.body.setCollideWorldBounds(false);

        // Animation state
        this._currentAnim = '';
        this._animLocked = false;  // true during attack/hurt anims

        // Stats
        this.hp = CONFIG.PLAYER_MAX_HP;
        this.maxHp = CONFIG.PLAYER_MAX_HP;
        this.alive = true;
        this.invulnerable = false;
        this.invulnTimer = 0;

        // Direction facing (for animations later)
        this.facing = 'down'; // up, down, left, right
        this.moving = false;

        // Inventory (6 slots, null = empty)
        this.inventory = new Array(CONFIG.INVENTORY_SLOTS).fill(null);
        this.activeMeleeSlot = -1; // -1 = fists
        this.activeRangedSlot = -1; // -1 = none
        this.selectedSlot = -1;

        // Melee state
        this.meleeWeapon = CONFIG.WEAPONS.FISTS;
        this.meleeCooldown = 0;
        this.isAttacking = false;

        // Ranged state
        this.rangedWeapon = null;
        this.rangedCooldown = 0;

        // Keys collected
        this.keys = 0;

        // Passive items collected
        this.passiveItems = [];

        // Stats tracking
        this.stats = {
            enemiesKilled: 0,
            roomsExplored: 0,
            panicsSurvived: 0,
            damageDealt: 0,
            damageTaken: 0,
            itemsCollected: 0,
            timeAlive: 0
        };

        // Input
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
            arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
            arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
            arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });

        // Number keys for inventory
        this.numKeys = [];
        for (let i = 0; i <= 6; i++) {
            const keyCode = Phaser.Input.Keyboard.KeyCodes['ZERO'] + i;
            this.numKeys.push(scene.input.keyboard.addKey(keyCode));
        }

        // Mouse for ranged attacks
        this.mousePointer = scene.input.activePointer;

        // Drop key
        this.dropKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    }

    update(delta, dungeon) {
        if (!this.alive) return;

        // Update timers
        this.stats.timeAlive += delta / 1000;
        if (this.invulnerable) {
            this.invulnTimer -= delta;
            if (this.invulnTimer <= 0) {
                this.invulnerable = false;
                this.sprite.setAlpha(1);
            } else {
                // Flash effect during invulnerability
                this.sprite.setAlpha(Math.sin(this.invulnTimer * 0.02) > 0 ? 1 : 0.3);
            }
        }

        // Cooldowns
        if (this.meleeCooldown > 0) this.meleeCooldown -= delta;
        if (this.rangedCooldown > 0) this.rangedCooldown -= delta;

        // Handle inventory selection
        this._handleInventoryInput();

        // Handle item drop
        if (Phaser.Input.Keyboard.JustDown(this.dropKey)) {
            this._dropSelectedItem();
        }

        // Movement
        this._handleMovement(delta, dungeon);

        // Update animation
        this._updateAnimation();
    }

    _updateAnimation() {
        if (this._animLocked) return;

        let animKey;
        if (this.isAttacking) {
            animKey = 'player_attack_' + this.facing;
            this._playAnim(animKey, true);
            return;
        }

        if (this.moving) {
            animKey = 'player_walk_' + this.facing;
        } else {
            animKey = 'player_idle_' + this.facing;
        }
        this._playAnim(animKey);
    }

    _playAnim(key, lock) {
        if (this._currentAnim === key) return;
        this._currentAnim = key;

        if (lock) {
            this._animLocked = true;
            this.sprite.play(key);
            this.sprite.once('animationcomplete', () => {
                this._animLocked = false;
                this._currentAnim = '';
            });
        } else {
            this.sprite.play(key, true);
        }
    }

    _handleMovement(delta, dungeon) {
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.cursors.arrowLeft.isDown) vx = -1;
        else if (this.cursors.right.isDown || this.cursors.arrowRight.isDown) vx = 1;

        if (this.cursors.up.isDown || this.cursors.arrowUp.isDown) vy = -1;
        else if (this.cursors.down.isDown || this.cursors.arrowDown.isDown) vy = 1;

        this.moving = (vx !== 0 || vy !== 0);

        // Footstep audio (throttled to avoid per-frame calls)
        if (this.moving) {
            this._footstepTimer = (this._footstepTimer || 0) + delta;
            if (this._footstepTimer >= 250) {
                AUDIO.playFootstep();
                this._footstepTimer = 0;
            }
        } else {
            this._footstepTimer = 0;
        }

        // Update facing direction (skip during attack so we keep facing the enemy)
        if (!this.isAttacking) {
            if (vx < 0) this.facing = 'left';
            else if (vx > 0) this.facing = 'right';
            if (vy < 0) this.facing = 'up';
            else if (vy > 0) this.facing = 'down';
        }

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const len = Math.sqrt(2);
            vx /= len;
            vy /= len;
        }

        const speed = CONFIG.PLAYER_SPEED * this.getPassiveMult('speed');

        // Use Phaser physics velocity instead of manual position updates
        this.sprite.body.setVelocity(vx * speed, vy * speed);

        // Tile-based collision prediction: stop movement axes that would enter walls
        if (this.moving) {
            const dt = delta / 1000;
            const halfSize = (CONFIG.TILE_SIZE - 2) / 2;
            const predictX = this.sprite.x + vx * speed * dt;
            const predictY = this.sprite.y + vy * speed * dt;

            // Check X axis - use predicted Y position for accurate diagonal collision
            const tileCheckX = Math.floor((predictX + (vx > 0 ? halfSize : -halfSize)) / CONFIG.TILE_SIZE);
            const tileCheckYForX1 = Math.floor((predictY - halfSize) / CONFIG.TILE_SIZE);
            const tileCheckYForX2 = Math.floor((predictY + halfSize) / CONFIG.TILE_SIZE);
            if (!dungeon.isWalkable(tileCheckX, tileCheckYForX1) ||
                !dungeon.isWalkable(tileCheckX, tileCheckYForX2)) {
                this.sprite.body.setVelocityX(0);
            }

            // Check Y axis - use predicted X position for accurate diagonal collision
            const tileCheckY = Math.floor((predictY + (vy > 0 ? halfSize : -halfSize)) / CONFIG.TILE_SIZE);
            const tileCheckXForY1 = Math.floor((predictX - halfSize) / CONFIG.TILE_SIZE);
            const tileCheckXForY2 = Math.floor((predictX + halfSize) / CONFIG.TILE_SIZE);
            if (!dungeon.isWalkable(tileCheckXForY1, tileCheckY) ||
                !dungeon.isWalkable(tileCheckXForY2, tileCheckY)) {
                this.sprite.body.setVelocityY(0);
            }
        }

        // Room reveal is handled by GameScene to avoid double exploration tracking

        // Also reveal corridor tiles around player
        const px = Math.floor(this.sprite.x / CONFIG.TILE_SIZE);
        const py = Math.floor(this.sprite.y / CONFIG.TILE_SIZE);
        const revealDist = 3;
        for (let dy = -revealDist; dy <= revealDist; dy++) {
            for (let dx = -revealDist; dx <= revealDist; dx++) {
                const tile = dungeon.getTile(px + dx, py + dy);
                if (tile) tile.explored = true;
            }
        }
    }

    _handleInventoryInput() {
        // Key 0 = fists
        if (Phaser.Input.Keyboard.JustDown(this.numKeys[0])) {
            this.activeMeleeSlot = -1;
            this.meleeWeapon = CONFIG.WEAPONS.FISTS;
        }

        // Keys 1-6 = inventory slots
        for (let i = 1; i <= CONFIG.INVENTORY_SLOTS; i++) {
            if (Phaser.Input.Keyboard.JustDown(this.numKeys[i])) {
                const slotIndex = i - 1;
                const item = this.inventory[slotIndex];
                if (!item) continue;

                if (item.weapon && item.weapon.type === 'melee') {
                    // Select as active melee
                    if (item.durability > 0) {
                        this.activeMeleeSlot = slotIndex;
                        this.meleeWeapon = item.weapon;
                    }
                } else if (item.weapon && item.weapon.type === 'ranged') {
                    // Select as active ranged (doesn't deselect melee)
                    if (this.activeRangedSlot === slotIndex) {
                        // Deselect if pressing same slot
                        this.activeRangedSlot = -1;
                        this.rangedWeapon = null;
                    } else {
                        this.activeRangedSlot = slotIndex;
                        this.rangedWeapon = item.weapon;
                    }
                } else if (item.type === 'repair_kit') {
                    // Use repair kit on active melee weapon
                    this._useRepairKit(slotIndex);
                }
                AUDIO.playInventorySelect();
                this.selectedSlot = slotIndex;
            }
        }

        // Check if active melee weapon is broken
        if (this.activeMeleeSlot >= 0) {
            const item = this.inventory[this.activeMeleeSlot];
            if (!item || item.durability <= 0) {
                this.activeMeleeSlot = -1;
                this.meleeWeapon = CONFIG.WEAPONS.FISTS;
            }
        }
    }

    takeDamage(amount) {
        if (this.invulnerable || !this.alive) return;

        // Berserker mode: 50% damage reduction during panic
        if (this.scene.panicState && this.scene.panicState.berserkerActive) {
            amount = Math.floor(amount * 0.5);
        }

        // Fortress mode: 75% damage reduction
        if (this.scene.panicState && this.scene.panicState.fortressActive) {
            amount = Math.floor(amount * 0.25);
        }

        // Passive item damage reduction
        amount = Math.floor(amount * this.getPassiveMult('damageTaken'));

        this.hp -= amount;
        this.stats.damageTaken += amount;
        this.invulnerable = true;
        this.invulnTimer = CONFIG.PLAYER_INVULN_TIME;
        AUDIO.playPlayerHurt();

        // Red flash (tint-based)
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.alive) this.sprite.clearTint();
        });

        // Play hurt animation
        this._playAnim('player_hurt', true);

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    die() {
        this.alive = false;
        AUDIO.playPlayerDeath();
        AUDIO.stopAll();

        // Play death animation
        this.sprite.setTint(0xff4444);
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(400, 0.02);
            this.scene.cameras.main.flash(300, 180, 0, 0);
        }
        if (this.scene.particles) {
            this.scene.particles.deathBurst(this.sprite.x, this.sprite.y);
            this.scene.particles.bloodSplatter(this.sprite.x, this.sprite.y, 12);
        }

        this._currentAnim = '';
        this._animLocked = true;
        this.sprite.play('player_death');

        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.2,
            duration: 1500,
            ease: 'Power2'
        });
        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.stop('HUDScene');
            this.scene.scene.start('DeathScene', { stats: this.stats });
        });
    }

    addToInventory(item) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] === null) {
                this.inventory[i] = item;
                this.stats.itemsCollected++;
                return true;
            }
        }
        return false; // Inventory full
    }

    addPassiveItem(passiveKey) {
        const passive = CONFIG.PASSIVE_ITEMS[passiveKey];
        if (!passive) return false;
        this.passiveItems.push({ key: passiveKey, ...passive });

        // Apply immediate effects
        if (passive.maxHpBonus) {
            this.maxHp += passive.maxHpBonus;
            this.hp = Math.min(this.hp + passive.maxHpBonus, this.maxHp);
        }
        return true;
    }

    getPassiveMult(stat) {
        let mult = 1;
        for (const p of this.passiveItems) {
            switch (stat) {
                case 'speed': if (p.speedMult) mult *= p.speedMult; break;
                case 'damageTaken': if (p.damageTakenMult) mult *= p.damageTakenMult; break;
                case 'meleeDamage': if (p.meleeDamageMult) mult *= p.meleeDamageMult; break;
                case 'meleeSpeed': if (p.meleeSpeedMult) mult *= p.meleeSpeedMult; break;
                case 'corruption': if (p.corruptionMult) mult *= p.corruptionMult; break;
                case 'corruptDecay': if (p.corruptDecayMult) mult *= p.corruptDecayMult; break;
            }
        }
        // Apply meta-progression multipliers
        if (stat === 'speed' && this._metaSpeedMult) mult *= this._metaSpeedMult;
        if (stat === 'meleeDamage' && this._metaMeleeMult) mult *= this._metaMeleeMult;
        if (stat === 'corruption' && this._metaCorruptMult) mult *= this._metaCorruptMult;
        return mult;
    }

    removeFromInventory(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.inventory.length) {
            // If removing active weapon, reset
            if (slotIndex === this.activeMeleeSlot) {
                this.activeMeleeSlot = -1;
                this.meleeWeapon = CONFIG.WEAPONS.FISTS;
            }
            if (slotIndex === this.activeRangedSlot) {
                this.activeRangedSlot = -1;
                this.rangedWeapon = null;
            }
            const item = this.inventory[slotIndex];
            this.inventory[slotIndex] = null;
            return item;
        }
        return null;
    }

    _dropSelectedItem() {
        if (this.selectedSlot < 0 || this.selectedSlot >= this.inventory.length) return;
        const item = this.inventory[this.selectedSlot];
        if (!item) return;

        // Notify scene to create a dropped item sprite
        const droppedItem = this.removeFromInventory(this.selectedSlot);
        if (droppedItem && this.scene.dropItem) {
            AUDIO.playItemDrop();
            this.scene.dropItem(droppedItem, this.sprite.x, this.sprite.y);
        }
        this.selectedSlot = -1;
    }

    _useRepairKit(repairSlotIndex) {
        // Find a broken or damaged melee weapon in inventory
        let targetSlot = -1;

        // Prefer the active melee weapon if it has durability
        if (this.activeMeleeSlot >= 0) {
            const item = this.inventory[this.activeMeleeSlot];
            if (item && item.durability !== undefined && item.durability < item.weapon.durability) {
                targetSlot = this.activeMeleeSlot;
            }
        }

        // Otherwise find any damaged melee weapon
        if (targetSlot === -1) {
            for (let i = 0; i < this.inventory.length; i++) {
                const item = this.inventory[i];
                if (item && item.weapon && item.weapon.type === 'melee' &&
                    item.durability !== undefined && item.durability < item.weapon.durability) {
                    targetSlot = i;
                    break;
                }
            }
        }

        if (targetSlot === -1) return; // No weapon to repair

        const weapon = this.inventory[targetSlot];
        weapon.durability = weapon.weapon.durability; // Full restore

        // If it was broken and was our active melee, re-equip it
        if (this.activeMeleeSlot === -1 && weapon.weapon.type === 'melee') {
            this.activeMeleeSlot = targetSlot;
            this.meleeWeapon = weapon.weapon;
        }

        // Consume the repair kit
        this.inventory[repairSlotIndex] = null;

        // Flash green (tint-based)
        this.sprite.setTint(0x44ff44);
        this.scene.time.delayedCall(200, () => {
            if (this.alive) this.sprite.clearTint();
        });
    }

    getWorldPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    getTilePosition() {
        return {
            x: Math.floor(this.sprite.x / CONFIG.TILE_SIZE),
            y: Math.floor(this.sprite.y / CONFIG.TILE_SIZE)
        };
    }
}

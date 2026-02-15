// ============================================
// President Devil — Player Controller
// ============================================

class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Create player sprite (placeholder rectangle)
        this.sprite = scene.add.rectangle(
            x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            CONFIG.TILE_SIZE - 2,
            CONFIG.TILE_SIZE - 2,
            CONFIG.COLORS.PLAYER
        );
        this.sprite.setDepth(60);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(false);

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
        this._handleMovement(dungeon);
    }

    _handleMovement(dungeon) {
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.cursors.arrowLeft.isDown) vx = -1;
        else if (this.cursors.right.isDown || this.cursors.arrowRight.isDown) vx = 1;

        if (this.cursors.up.isDown || this.cursors.arrowUp.isDown) vy = -1;
        else if (this.cursors.down.isDown || this.cursors.arrowDown.isDown) vy = 1;

        this.moving = (vx !== 0 || vy !== 0);

        // Update facing direction
        if (vx < 0) this.facing = 'left';
        else if (vx > 0) this.facing = 'right';
        if (vy < 0) this.facing = 'up';
        else if (vy > 0) this.facing = 'down';

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const len = Math.sqrt(2);
            vx /= len;
            vy /= len;
        }

        const speed = CONFIG.PLAYER_SPEED * this.getPassiveMult('speed');
        const newX = this.sprite.x + vx * speed * (1 / 60);
        const newY = this.sprite.y + vy * speed * (1 / 60);

        // Tile-based collision
        const halfSize = (CONFIG.TILE_SIZE - 2) / 2;

        // Check X movement
        const tileCheckX = Math.floor((newX + (vx > 0 ? halfSize : -halfSize)) / CONFIG.TILE_SIZE);
        const tileCheckYForX1 = Math.floor((this.sprite.y - halfSize) / CONFIG.TILE_SIZE);
        const tileCheckYForX2 = Math.floor((this.sprite.y + halfSize) / CONFIG.TILE_SIZE);

        if (dungeon.isWalkable(tileCheckX, tileCheckYForX1) &&
            dungeon.isWalkable(tileCheckX, tileCheckYForX2)) {
            this.sprite.x = newX;
        }

        // Check Y movement
        const tileCheckY = Math.floor((newY + (vy > 0 ? halfSize : -halfSize)) / CONFIG.TILE_SIZE);
        const tileCheckXForY1 = Math.floor((this.sprite.x - halfSize) / CONFIG.TILE_SIZE);
        const tileCheckXForY2 = Math.floor((this.sprite.x + halfSize) / CONFIG.TILE_SIZE);

        if (dungeon.isWalkable(tileCheckXForY1, tileCheckY) &&
            dungeon.isWalkable(tileCheckXForY2, tileCheckY)) {
            this.sprite.y = newY;
        }

        // Reveal room
        const currentRoom = dungeon.getRoomAt(this.sprite.x, this.sprite.y);
        if (currentRoom && !currentRoom.explored) {
            dungeon.revealRoom(currentRoom);
            this.stats.roomsExplored++;
        }

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

        // Passive item damage reduction
        amount = Math.floor(amount * this.getPassiveMult('damageTaken'));

        this.hp -= amount;
        this.stats.damageTaken += amount;
        this.invulnerable = true;
        this.invulnTimer = CONFIG.PLAYER_INVULN_TIME;

        // Red flash
        this.sprite.setFillStyle(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.alive) this.sprite.setFillStyle(CONFIG.COLORS.PLAYER);
        });

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

        // Dramatic death animation: flash red, shake camera, shrink+spin
        this.sprite.setFillStyle(CONFIG.COLORS.BLOOD);
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(400, 0.02);
            this.scene.cameras.main.flash(300, 180, 0, 0);
        }
        if (this.scene.particles) {
            this.scene.particles.deathBurst(this.sprite.x, this.sprite.y);
            this.scene.particles.bloodSplatter(this.sprite.x, this.sprite.y, 12);
        }
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0.2,
            scaleY: 0.2,
            alpha: 0.1,
            angle: 360,
            duration: 1200,
            ease: 'Power3'
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

        // Flash green
        this.sprite.setFillStyle(0x44ff44);
        this.scene.time.delayedCall(200, () => {
            if (this.alive) this.sprite.setFillStyle(CONFIG.COLORS.PLAYER);
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

// ============================================
// President Devil — Game Scene (Main Gameplay)
// ============================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Generate dungeon
        this.dungeon = new Dungeon();
        this.dungeon.generate();

        // Set world bounds
        const worldW = this.dungeon.width * CONFIG.TILE_SIZE;
        const worldH = this.dungeon.height * CONFIG.TILE_SIZE;
        this.physics.world.setBounds(0, 0, worldW, worldH);

        // Render dungeon tiles + fog (single pass)
        this.tileGraphics = this.add.graphics();
        this.tileGraphics.setDepth(1);
        this.wallOverlayGraphics = this.add.graphics();
        this.wallOverlayGraphics.setDepth(58);

        // Create player in start room
        const startRoom = this.dungeon.rooms.find(r => r.type === 'start') || this.dungeon.rooms[0];
        this.player = new Player(this, startRoom.centerX, startRoom.centerY);
        this.playerLabel = this._createWorldLabel(this.player.sprite.x, this.player.sprite.y - 14, 'YOU', '#ffffff');
        this.dungeon.revealRoom(startRoom);

        // Camera follow
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(CONFIG.SCALE);
        this.cameras.main.setBackgroundColor('#000000');

        // Enemy manager
        this.enemyManager = new EnemyManager(this);
        this._spawnInitialEnemies();

        // Combat system
        this.combatSystem = new CombatSystem(this);

        // Corruption system
        this.corruption = new CorruptionSystem(this);

        // Item sprites
        this.itemSprites = [];
        this._createItemSprites();

        // Door sprites
        this.doorSprites = [];
        this._createDoorSprites();

        // Panic event state
        this.panicState = {
            active: false,
            currentWave: 0,
            totalWaves: CONFIG.PANIC_WAVE_COUNT,
            enemiesRemaining: 0,
            room: null
        };

        // HUD (separate scene overlay at zoom 1)
        this.scene.launch('HUDScene');

        // Render initial tiles
        this._renderWorld();
    }

    update(time, delta) {
        if (!this.player.alive) return;

        this.playerLabel.setPosition(this.player.sprite.x, this.player.sprite.y - 14);

        // Update player
        this.player.update(delta, this.dungeon);

        // Update enemies
        this.enemyManager.update(delta, this.player, this.dungeon);

        // Update combat
        this.combatSystem.update(delta, this.player, this.enemyManager, this.corruption);

        // Update corruption
        const shouldPanic = this.corruption.update(delta, this.player);

        // Check for panic event triggers
        if (shouldPanic && !this.panicState.active) {
            const currentRoom = this.dungeon.getRoomAt(this.player.sprite.x, this.player.sprite.y);
            if (currentRoom && currentRoom.type !== 'start') {
                this._startPanicEvent(currentRoom);
            }
        }

        // Reveal rooms and nearby tiles as player explores
        const currentRoom = this.dungeon.getRoomAt(this.player.sprite.x, this.player.sprite.y);
        if (currentRoom && !currentRoom.explored) {
            this.dungeon.revealRoom(currentRoom);
            if (this.player.stats) {
                this.player.stats.roomsExplored = (this.player.stats.roomsExplored || 0) + 1;
            }
        }
        this._revealNearbyTiles();

        // Check event room entry
        if (currentRoom && currentRoom.type === 'event' && !this.panicState.active && !currentRoom._eventTriggered) {
            currentRoom._eventTriggered = true;
            this._startPanicEvent(currentRoom);
        }

        // Update panic event
        if (this.panicState.active) {
            this._updatePanicEvent();
        }

        // Check item pickups
        this._checkItemPickups();

        // Check door interactions
        this._checkDoorInteractions();

        // Check win condition (reach boss room)
        this._checkWinCondition();

        // Hide/fade entities in darkness so world readability matches fog
        this._updateEntityVisibility();

        // Render (single combined pass)
        this._renderWorld();
        this._renderWallOverlay();

        // Periodic enemy cleanup
        if (time % 5000 < 20) {
            this.enemyManager.cleanup();
        }
    }

    _renderWorld() {
        const g = this.tileGraphics;
        g.clear();

        const cam = this.cameras.main;
        const scrollX = cam.scrollX;
        const scrollY = cam.scrollY;
        const viewW = cam.width / cam.zoom;
        const viewH = cam.height / cam.zoom;

        const startTileX = Math.max(0, Math.floor(scrollX / CONFIG.TILE_SIZE) - 1);
        const startTileY = Math.max(0, Math.floor(scrollY / CONFIG.TILE_SIZE) - 1);
        const endTileX = Math.min(this.dungeon.width, Math.ceil((scrollX + viewW) / CONFIG.TILE_SIZE) + 1);
        const endTileY = Math.min(this.dungeon.height, Math.ceil((scrollY + viewH) / CONFIG.TILE_SIZE) + 1);

        const playerX = this.player.sprite.x;
        const playerY = this.player.sprite.y;

        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = this.dungeon.getTile(x, y);
                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;
                const cx = px + CONFIG.TILE_SIZE / 2;
                const cy = py + CONFIG.TILE_SIZE / 2;
                const dist = Phaser.Math.Distance.Between(playerX, playerY, cx, cy);

                // Draw tile
                if (tile.type === 'wall') {
                    const room = this._getAdjacentRoom(x, y);
                    if (room && room.type === 'boss') {
                        g.fillStyle(CONFIG.COLORS.WALL_RITUAL, 1);
                    } else {
                        g.fillStyle(CONFIG.COLORS.WALL, 1);
                    }
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                    g.lineStyle(1, CONFIG.COLORS.WALL_EDGE, 0.8);
                    g.strokeRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                } else if (tile.type === 'floor') {
                    if (tile.room && tile.room.type === 'boss') {
                        g.fillStyle(CONFIG.COLORS.FLOOR_BOSS, 1);
                    } else if (tile.corridor) {
                        g.fillStyle(CONFIG.COLORS.FLOOR_CONCRETE, 1);
                    } else {
                        g.fillStyle(CONFIG.COLORS.FLOOR_OFFICE, 1);
                    }
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                    g.lineStyle(1, 0x000000, 0.15);
                    g.strokeRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                }

                // Overlay darkness (balanced)
                if (!tile.explored) {
                    let alpha = 0.82;
                    if (dist <= CONFIG.VISIBILITY_RADIUS) {
                        alpha = 0.42;
                    } else if (dist <= CONFIG.FOG_RADIUS) {
                        alpha = 0.65;
                    }
                    g.fillStyle(0x000000, alpha);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                } else if (dist > CONFIG.FOG_RADIUS) {
                    g.fillStyle(0x000000, 0.55);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                } else if (dist > CONFIG.VISIBILITY_RADIUS) {
                    const alpha = 0.15 + ((dist - CONFIG.VISIBILITY_RADIUS) / (CONFIG.FOG_RADIUS - CONFIG.VISIBILITY_RADIUS)) * 0.3;
                    g.fillStyle(0x000000, alpha);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                }
            }
        }
    }

    _renderWallOverlay() {
        const g = this.wallOverlayGraphics;
        g.clear();

        const playerTileX = Math.floor(this.player.sprite.x / CONFIG.TILE_SIZE);
        const playerTileY = Math.floor(this.player.sprite.y / CONFIG.TILE_SIZE);
        const radiusTiles = Math.ceil(CONFIG.VISIBILITY_RADIUS / CONFIG.TILE_SIZE) + 2;

        const startX = Math.max(0, playerTileX - radiusTiles);
        const endX = Math.min(this.dungeon.width - 1, playerTileX + radiusTiles);
        const startY = Math.max(0, playerTileY - radiusTiles);
        const endY = Math.min(this.dungeon.height - 1, playerTileY + radiusTiles);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = this.dungeon.getTile(x, y);
                if (!tile || tile.type !== 'wall') continue;

                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;
                const cx = px + CONFIG.TILE_SIZE / 2;
                const cy = py + CONFIG.TILE_SIZE / 2;
                const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, cx, cy);

                if (dist > CONFIG.FOG_RADIUS + CONFIG.TILE_SIZE * 2) continue;

                const t = Phaser.Math.Clamp((dist - CONFIG.VISIBILITY_RADIUS) / Math.max(1, (CONFIG.FOG_RADIUS - CONFIG.VISIBILITY_RADIUS)), 0, 1);
                const fillAlpha = 0.16 * (1 - t);
                const strokeAlpha = 0.7 - t * 0.45;

                if (fillAlpha > 0.01) {
                    g.fillStyle(0xa7a7cf, fillAlpha);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                }
                g.lineStyle(1, 0xc8c8ff, strokeAlpha);
                g.strokeRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            }
        }
    }

    _updateEntityVisibility() {
        const playerX = this.player.sprite.x;
        const playerY = this.player.sprite.y;

        const getVisibilityAlpha = (x, y) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, x, y);
            const tileX = Math.floor(x / CONFIG.TILE_SIZE);
            const tileY = Math.floor(y / CONFIG.TILE_SIZE);
            const tile = this.dungeon.getTile(tileX, tileY);

            if (!tile.explored) {
                return dist <= CONFIG.VISIBILITY_RADIUS ? 0.2 : 0;
            }
            if (dist <= CONFIG.VISIBILITY_RADIUS) return 1;
            if (dist >= CONFIG.FOG_RADIUS) return 0.2;

            const t = (dist - CONFIG.VISIBILITY_RADIUS) / Math.max(1, (CONFIG.FOG_RADIUS - CONFIG.VISIBILITY_RADIUS));
            return 1 - t * 0.8;
        };

        for (const enemy of this.enemyManager.enemies) {
            if (!enemy.alive || !enemy.sprite) continue;
            const alpha = getVisibilityAlpha(enemy.sprite.x, enemy.sprite.y);
            enemy.sprite.setAlpha(alpha);
            if (enemy.label) {
                enemy.label.setPosition(enemy.sprite.x, enemy.sprite.y - 12);
                enemy.label.setAlpha(alpha);
            }
        }

        for (const sprite of this.itemSprites) {
            if (!sprite.active) continue;
            const alpha = getVisibilityAlpha(sprite.x, sprite.y);
            sprite.setAlpha(alpha);
            const label = sprite.getData('label');
            if (label) {
                label.setPosition(sprite.x, sprite.y - 12);
                label.setAlpha(alpha);
            }
        }

        for (const sprite of this.doorSprites) {
            if (!sprite.active) continue;
            const alpha = getVisibilityAlpha(sprite.x, sprite.y);
            sprite.setAlpha(alpha);
            const label = sprite.getData('label');
            if (label) {
                label.setPosition(sprite.x, sprite.y - 12);
                label.setAlpha(sprite.visible ? alpha : 0);
            }
        }

        this.playerLabel.setAlpha(1);
    }

    _revealNearbyTiles() {
        const playerX = this.player.sprite.x;
        const playerY = this.player.sprite.y;
        const radius = CONFIG.VISIBILITY_RADIUS;

        const startTileX = Math.max(0, Math.floor((playerX - radius) / CONFIG.TILE_SIZE));
        const startTileY = Math.max(0, Math.floor((playerY - radius) / CONFIG.TILE_SIZE));
        const endTileX = Math.min(this.dungeon.width, Math.ceil((playerX + radius) / CONFIG.TILE_SIZE));
        const endTileY = Math.min(this.dungeon.height, Math.ceil((playerY + radius) / CONFIG.TILE_SIZE));

        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = this.dungeon.getTile(x, y);
                if (tile && !tile.explored) {
                    const px = x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                    const py = y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                    const dist = Phaser.Math.Distance.Between(playerX, playerY, px, py);
                    if (dist <= radius) {
                        tile.explored = true;
                    }
                }
            }
        }
    }

    _getAdjacentRoom(x, y) {
        const neighbors = [
            this.dungeon.getTile(x - 1, y),
            this.dungeon.getTile(x + 1, y),
            this.dungeon.getTile(x, y - 1),
            this.dungeon.getTile(x, y + 1)
        ];
        for (const n of neighbors) {
            if (n && n.room) return n.room;
        }
        return null;
    }

    _spawnInitialEnemies() {
        for (const room of this.dungeon.rooms) {
            if (room.type === 'start') continue;

            const count = room.type === 'boss' ? 0 : Phaser.Math.Between(1, 3);
            this.enemyManager.spawnInRoom(room, count);
        }
    }

    _createItemSprites() {
        for (const spawn of this.dungeon.itemSpawns) {
            const px = spawn.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = spawn.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            let color;
            if (spawn.type === 'health') color = CONFIG.COLORS.ITEM_HEALTH;
            else if (spawn.type === 'key') color = CONFIG.COLORS.ITEM_KEY;
            else if (spawn.type.startsWith('ammo')) color = CONFIG.COLORS.ITEM_AMMO;
            else if (spawn.type.startsWith('weapon')) color = CONFIG.COLORS.ITEM_WEAPON;
            else color = 0x888888;

            const sprite = this.add.rectangle(px, py, 8, 8, color);
            sprite.setDepth(55);
            sprite.setData('itemSpawn', spawn);
            sprite.setData('label', this._createWorldLabel(px, py - 12, this._getItemLabel(spawn.type), '#dddddd'));
            this.itemSprites.push(sprite);

            // Gentle bob animation
            this.tweens.add({
                targets: sprite,
                y: py - 2,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    _createDoorSprites() {
        for (const door of this.dungeon.doors) {
            const px = door.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = door.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            let color;
            if (door.type === 'locked') color = CONFIG.COLORS.DOOR_LOCKED;
            else color = CONFIG.COLORS.DOOR;

            const sprite = this.add.rectangle(px, py, CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2, color);
            sprite.setDepth(55);
            sprite.setData('door', door);
            sprite.setData('label', this._createWorldLabel(px, py - 12, this._getDoorLabel(door.type), '#ffdd88'));
            sprite.setVisible(!door.open);
            this.doorSprites.push(sprite);
        }
    }

    _checkItemPickups() {
        const pos = this.player.getWorldPosition();

        for (let i = this.itemSprites.length - 1; i >= 0; i--) {
            const sprite = this.itemSprites[i];
            const dist = Phaser.Math.Distance.Between(pos.x, pos.y, sprite.x, sprite.y);

            if (dist < CONFIG.TILE_SIZE) {
                const spawn = sprite.getData('itemSpawn');
                const item = this._createItemFromSpawn(spawn);

                if (item) {
                    let picked = false;
                    if (item.type === 'key') {
                        this.player.keys++;
                        picked = true;
                    } else if (item.type === 'health') {
                        if (this.player.hp < this.player.maxHp) {
                            this.player.heal(25);
                            picked = true;
                        }
                    } else {
                        // Try to add to inventory (or stack ammo)
                        if (item.type && item.type.startsWith('ammo')) {
                            // Try to stack with existing ammo
                            const stacked = this._stackAmmo(item);
                            if (!stacked) {
                                picked = this.player.addToInventory(item);
                            } else {
                                picked = true;
                            }
                        } else {
                            picked = this.player.addToInventory(item);
                        }
                    }

                    if (picked) {
                        const label = sprite.getData('label');
                        if (label) label.destroy();
                        sprite.destroy();
                        this.itemSprites.splice(i, 1);
                    }
                }
            }
        }
    }

    _stackAmmo(ammoItem) {
        for (const invItem of this.player.inventory) {
            if (invItem && invItem.type === ammoItem.type) {
                invItem.count += ammoItem.count;
                return true;
            }
        }
        return false;
    }

    _createItemFromSpawn(spawn) {
        switch (spawn.type) {
            case 'health':
                return { type: 'health', name: 'Health Kit' };
            case 'key':
                return { type: 'key', name: 'Key' };
            case 'repair_kit':
                return { type: 'repair_kit', name: 'Repair Kit' };
            case 'ammo_pistol':
                return { type: 'ammo_pistol', name: 'Pistol Ammo', count: Phaser.Math.Between(5, 12) };
            case 'ammo_shotgun':
                return { type: 'ammo_shotgun', name: 'Shotgun Shells', count: Phaser.Math.Between(2, 6) };
            case 'ammo_crossbow':
                return { type: 'ammo_crossbow', name: 'Crossbow Bolts', count: Phaser.Math.Between(3, 8) };
            case 'weapon_knife':
                return { type: 'weapon', name: 'Knife', weapon: CONFIG.WEAPONS.KNIFE, durability: 20 };
            case 'weapon_bat':
                return { type: 'weapon', name: 'Baseball Bat', weapon: CONFIG.WEAPONS.BAT, durability: 30 };
            case 'weapon_handgun':
                return { type: 'weapon', name: 'Handgun', weapon: CONFIG.WEAPONS.HANDGUN };
            case 'weapon_shotgun':
                return { type: 'weapon', name: 'Shotgun', weapon: CONFIG.WEAPONS.SHOTGUN };
            case 'weapon_crossbow':
                return { type: 'weapon', name: 'Crossbow', weapon: CONFIG.WEAPONS.CROSSBOW };
            default:
                return null;
        }
    }

    _checkDoorInteractions() {
        const pos = this.player.getWorldPosition();

        for (const sprite of this.doorSprites) {
            const door = sprite.getData('door');
            if (door.open) continue;

            const dist = Phaser.Math.Distance.Between(pos.x, pos.y, sprite.x, sprite.y);
            if (dist < CONFIG.TILE_SIZE * 1.5) {
                if (door.type === 'locked') {
                    if (this.player.keys > 0) {
                        this.player.keys--;
                        door.open = true;
                        door.type = 'normal';
                        sprite.setVisible(false);
                        const label = sprite.getData('label');
                        if (label) label.setVisible(false);
                    }
                } else if (door.type === 'normal' && !door.room.doorsSealed) {
                    door.open = true;
                    sprite.setVisible(false);
                    const label = sprite.getData('label');
                    if (label) label.setVisible(false);
                }
            }
        }
    }

    _startPanicEvent(room) {
        if (!room || this.panicState.active) return;

        this.panicState.active = true;
        this.panicState.currentWave = 1;
        this.panicState.totalWaves = CONFIG.PANIC_WAVE_COUNT;
        this.panicState.room = room;

        // Seal doors
        room.doorsSealed = true;
        for (const sprite of this.doorSprites) {
            const door = sprite.getData('door');
            if (door.room === room) {
                door.open = false;
                sprite.setVisible(true);
                sprite.setFillStyle(CONFIG.COLORS.DOOR_SEALED);
                const label = sprite.getData('label');
                if (label) {
                    label.setText('SEALED');
                    label.setVisible(true);
                }
            }
        }

        // Screen effect
        this.cameras.main.shake(300, 0.005);
        this.cameras.main.flash(200, 100, 0, 0);

        // Corruption spike
        this.corruption.add(10);
        this.corruption.setPanicTriggered();

        // Apply temporary weapon evolution
        this._applyWeaponEvolution();

        // Spawn first wave
        this._spawnPanicWave(room);
    }

    _spawnPanicWave(room) {
        const level = this.corruption.getLevel();
        const count = Math.floor(CONFIG.PANIC_ENEMIES_PER_WAVE * level);

        for (let i = 0; i < count; i++) {
            const edge = Phaser.Math.Between(0, 3);
            let x, y;
            switch (edge) {
                case 0: // top
                    x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
                    y = room.y + 1;
                    break;
                case 1: // bottom
                    x = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
                    y = room.y + room.height - 2;
                    break;
                case 2: // left
                    x = room.x + 1;
                    y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);
                    break;
                case 3: // right
                    x = room.x + room.width - 2;
                    y = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);
                    break;
            }

            const type = Math.random() < (0.5 + level * 0.1) ? 'lurker' : 'crawler';
            this.enemyManager.spawnAtPosition(x, y, type);
        }

        this.panicState.enemiesRemaining = count;
    }

    _updatePanicEvent() {
        if (!this.panicState.active) return;

        // Count alive enemies in panic room
        const room = this.panicState.room;
        const aliveInRoom = this.enemyManager.getAliveEnemies().filter(e => {
            const ex = Math.floor(e.sprite.x / CONFIG.TILE_SIZE);
            const ey = Math.floor(e.sprite.y / CONFIG.TILE_SIZE);
            return ex >= room.x && ex < room.x + room.width &&
                   ey >= room.y && ey < room.y + room.height;
        });

        if (aliveInRoom.length === 0) {
            if (this.panicState.currentWave < this.panicState.totalWaves) {
                // Next wave
                this.panicState.currentWave++;
                this.time.delayedCall(CONFIG.PANIC_WAVE_DELAY, () => {
                    if (this.panicState.active) {
                        this._spawnPanicWave(room);
                        this.cameras.main.flash(100, 80, 0, 0);
                    }
                });
            } else {
                // Panic event complete
                this._endPanicEvent();
            }
        }
    }

    _endPanicEvent() {
        this.panicState.active = false;
        const room = this.panicState.room;

        // Unseal doors
        room.doorsSealed = false;
        for (const sprite of this.doorSprites) {
            const door = sprite.getData('door');
            if (door.room === room) {
                door.open = true;
                sprite.setVisible(false);
                sprite.setFillStyle(CONFIG.COLORS.DOOR);
                const label = sprite.getData('label');
                if (label) label.setVisible(false);
            }
        }

        // Player survived
        this.player.stats.panicsSurvived++;

        // Drop loot in the room
        const lootCount = Phaser.Math.Between(2, 4);
        for (let i = 0; i < lootCount; i++) {
            const lx = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
            const ly = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);
            const roll = Math.random();
            let type;
            if (roll < 0.3) type = 'health';
            else if (roll < 0.6) type = 'ammo_pistol';
            else if (roll < 0.75) type = 'ammo_shotgun';
            else if (roll < 0.85) type = 'weapon_knife';
            else type = 'weapon_bat';

            const spawn = { x: lx, y: ly, type: type };
            this.dungeon.itemSpawns.push(spawn);

            const px = lx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = ly * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            let color;
            if (type === 'health') color = CONFIG.COLORS.ITEM_HEALTH;
            else if (type.startsWith('ammo')) color = CONFIG.COLORS.ITEM_AMMO;
            else color = CONFIG.COLORS.ITEM_WEAPON;

            const sprite = this.add.rectangle(px, py, 8, 8, color);
            sprite.setDepth(55);
            sprite.setData('itemSpawn', spawn);
            sprite.setData('label', this._createWorldLabel(px, py - 12, this._getItemLabel(type), '#dddddd'));
            this.itemSprites.push(sprite);

            this.tweens.add({
                targets: sprite,
                y: py - 2,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Reduce corruption slightly (relief phase)
        this.corruption.reduce(15);
        this.corruption.resetPanicFlag();

        // Revert weapon evolution
        this._revertWeaponEvolution();

        // Screen effect
        this.cameras.main.flash(300, 0, 50, 0);
    }

    _applyWeaponEvolution() {
        // Save original weapon stats for revert
        this.panicState.originalMelee = { ...this.player.meleeWeapon };
        this.panicState.originalRanged = this.player.rangedWeapon ? { ...this.player.rangedWeapon } : null;

        // Choose a random evolution based on what the player has
        const evolutions = [];

        // Melee evolutions
        evolutions.push('melee_frenzy');  // 2x speed, 1.5x damage
        evolutions.push('melee_slam');    // 3x damage, slow, AOE stun

        // Ranged evolutions (only if player has ranged)
        if (this.player.rangedWeapon) {
            evolutions.push('ranged_spread');   // Triple shot
            evolutions.push('ranged_piercing'); // 2x damage, passes through
        }

        // General evolutions
        evolutions.push('berserker');     // Both weapons 2x speed, player takes 50% damage

        const chosen = evolutions[Phaser.Math.Between(0, evolutions.length - 1)];
        this.panicState.evolution = chosen;

        switch (chosen) {
            case 'melee_frenzy':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, speed: this.player.meleeWeapon.speed * 0.5, damage: Math.floor(this.player.meleeWeapon.damage * 1.5) };
                this.panicState.evolutionName = 'FRENZY MODE';
                break;
            case 'melee_slam':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, speed: this.player.meleeWeapon.speed * 1.5, damage: Math.floor(this.player.meleeWeapon.damage * 3) };
                this.panicState.evolutionName = 'SLAM MODE';
                break;
            case 'ranged_spread':
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, spread: (this.player.rangedWeapon.spread || 1) * 3 };
                }
                this.panicState.evolutionName = 'SPREAD SHOT';
                break;
            case 'ranged_piercing':
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, damage: Math.floor(this.player.rangedWeapon.damage * 2) };
                }
                this.panicState.evolutionName = 'PIERCING ROUNDS';
                break;
            case 'berserker':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, speed: this.player.meleeWeapon.speed * 0.5, damage: Math.floor(this.player.meleeWeapon.damage * 1.3) };
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, speed: this.player.rangedWeapon.speed * 0.5 };
                }
                this.panicState.berserkerActive = true;
                this.panicState.evolutionName = 'BERSERKER';
                break;
        }

        // Visual flash for evolution
        this.cameras.main.flash(150, 255, 200, 0);
    }

    _revertWeaponEvolution() {
        if (!this.panicState.originalMelee) return;

        // Restore original melee weapon reference
        if (this.player.activeMeleeSlot === -1) {
            this.player.meleeWeapon = CONFIG.WEAPONS.FISTS;
        } else {
            const item = this.player.inventory[this.player.activeMeleeSlot];
            if (item && item.weapon) {
                this.player.meleeWeapon = item.weapon;
            } else {
                this.player.meleeWeapon = CONFIG.WEAPONS.FISTS;
            }
        }

        // Restore ranged
        if (this.player.activeRangedSlot >= 0) {
            const item = this.player.inventory[this.player.activeRangedSlot];
            if (item && item.weapon) {
                this.player.rangedWeapon = item.weapon;
            } else {
                this.player.rangedWeapon = null;
            }
        } else {
            this.player.rangedWeapon = null;
        }

        this.panicState.berserkerActive = false;
        this.panicState.originalMelee = null;
        this.panicState.originalRanged = null;
        this.panicState.evolution = null;
        this.panicState.evolutionName = null;
    }

    _checkWinCondition() {
        if (this._won) return;
        const bossRoom = this.dungeon.rooms.find(r => r.type === 'boss');
        if (!bossRoom) return;

        const currentRoom = this.dungeon.getRoomAt(this.player.sprite.x, this.player.sprite.y);
        if (currentRoom === bossRoom) {
            // Must not be in a panic event
            if (this.panicState.active) return;

            this._won = true;
            this.cameras.main.flash(500, 0, 80, 0);
            this.time.delayedCall(1500, () => {
                this.scene.stop('HUDScene');
                this.scene.start('VictoryScene', { stats: this.player.stats });
            });
        }
    }

    dropItem(item, worldX, worldY) {
        // Convert inventory item back to a spawn type for display
        let spawnType = item.type || 'health';
        if (item.weapon) {
            const weaponMap = {
                'Knife': 'weapon_knife', 'Baseball Bat': 'weapon_bat',
                'Handgun': 'weapon_handgun', 'Shotgun': 'weapon_shotgun',
                'Crossbow': 'weapon_crossbow'
            };
            spawnType = weaponMap[item.weapon.name] || 'weapon_knife';
        }

        const spawn = { x: Math.floor(worldX / CONFIG.TILE_SIZE), y: Math.floor(worldY / CONFIG.TILE_SIZE), type: spawnType };
        this.dungeon.itemSpawns.push(spawn);

        const px = worldX;
        const py = worldY;
        let color;
        if (spawnType === 'health') color = CONFIG.COLORS.ITEM_HEALTH;
        else if (spawnType === 'key') color = CONFIG.COLORS.ITEM_KEY;
        else if (spawnType.startsWith('ammo')) color = CONFIG.COLORS.ITEM_AMMO;
        else if (spawnType.startsWith('weapon')) color = CONFIG.COLORS.ITEM_WEAPON;
        else if (spawnType === 'repair_kit') color = 0x88ff88;
        else color = 0x888888;

        const sprite = this.add.rectangle(px, py, 8, 8, color);
        sprite.setDepth(55);
        sprite.setData('itemSpawn', spawn);
        sprite.setData('label', this._createWorldLabel(px, py - 12, this._getItemLabel(spawnType), '#dddddd'));
        this.itemSprites.push(sprite);

        this.tweens.add({
            targets: sprite,
            y: py - 2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    _createWorldLabel(x, y, text, color) {
        return this.add.text(x, y, text, {
            fontSize: '8px',
            fill: color,
            fontFamily: 'monospace',
            backgroundColor: '#000000',
            padding: { left: 1, right: 1, top: 0, bottom: 0 }
        }).setOrigin(0.5).setDepth(59);
    }

    _getItemLabel(type) {
        const labels = {
            health: 'HEALTH',
            key: 'KEY',
            repair_kit: 'REPAIR',
            ammo_pistol: 'PISTOL AMMO',
            ammo_shotgun: 'SHOTGUN AMMO',
            ammo_crossbow: 'BOLTS',
            weapon_knife: 'KNIFE',
            weapon_bat: 'BAT',
            weapon_handgun: 'HANDGUN',
            weapon_shotgun: 'SHOTGUN',
            weapon_crossbow: 'CROSSBOW'
        };
        return labels[type] || 'ITEM';
    }

    _getDoorLabel(type) {
        if (type === 'locked') return 'LOCKED';
        if (type === 'sealed') return 'SEALED';
        return 'DOOR';
    }
}

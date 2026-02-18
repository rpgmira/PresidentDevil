// ============================================
// President Devil — Game Scene (Main Gameplay)
// ============================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this._shuttingDown = false;
        this.events.once('shutdown', this.shutdown, this);

        // Generate dungeon
        this.dungeon = new Dungeon();
        this.dungeon.generate();

        // Set world bounds
        const worldW = this.dungeon.width * CONFIG.TILE_SIZE;
        const worldH = this.dungeon.height * CONFIG.TILE_SIZE;
        this.physics.world.setBounds(0, 0, worldW, worldH);

        // Generate tile sprite textures if not yet done
        if (!this.textures.exists('tile_wall')) {
            TILE_SPRITE_GEN.generate(this);
        }

        // Pre-render static tile map to a RenderTexture (drawn once)
        this._buildTileMap(worldW, worldH);

        // Fog overlay (redrawn each frame)
        this.fogGraphics = this.add.graphics();
        this.fogGraphics.setDepth(2);
        this.wallOverlayGraphics = this.add.graphics();
        this.wallOverlayGraphics.setDepth(58);

        // Create player in start room
        const startRoom = this.dungeon.rooms.find(r => r.type === 'start') || this.dungeon.rooms[0];
        this.player = new Player(this, startRoom.centerX, startRoom.centerY);
        META.applyToPlayer(this.player);
        this.playerLabel = this._createWorldLabel(this.player.sprite.x, this.player.sprite.y - 14, 'YOU', '#ffffff');
        this.dungeon.revealRoom(startRoom);

        // Camera follow
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(CONFIG.SCALE);
        this.cameras.main.setBounds(0, 0, worldW, worldH);
        this.cameras.main.setBackgroundColor('#000000');

        // PointLight for atmospheric flashlight effect (GPU-accelerated)
        this.playerLight = this.add.pointlight(
            this.player.sprite.x, this.player.sprite.y,
            0xffe8cc,  // warm yellowish light
            CONFIG.VISIBILITY_RADIUS * 1.2,  // radius
            0.15,      // intensity (subtle, supplements fog)
            0.06       // attenuation
        );
        this.playerLight.setDepth(3);

        // Enemy manager
        this.enemyManager = new EnemyManager(this);
        this._spawnInitialEnemies();

        // Physics group for enemy sprites (used in overlap detection)
        this.enemySpriteGroup = this.physics.add.group();
        for (const enemy of this.enemyManager.enemies) {
            if (enemy.sprite) this.enemySpriteGroup.add(enemy.sprite);
        }

        // Combat system
        this.combatSystem = new CombatSystem(this);

        // Set up physics overlap: projectiles vs enemies
        this.physics.add.overlap(
            this.combatSystem.projectilePool,
            this.enemySpriteGroup,
            this._onProjectileHitEnemy,
            null,
            this
        );

        // Corruption system
        this.corruption = new CorruptionSystem(this);

        // Particle system
        this.particles = new ParticleSystem(this);

        // Generate item sprite textures if not yet done
        if (!this.textures.exists('item_health')) {
            ITEM_SPRITE_GEN.generate(this);
        }

        // Item sprites
        this.itemSprites = [];
        this._createItemSprites();

        // Door sprites
        this.doorSprites = [];
        this._createDoorSprites();

        // Furniture sprites
        this.furnitureSprites = [];
        this.blockingFurnitureGroup = this.physics.add.staticGroup();
        this._createFurnitureSprites();

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

        // Debug indicator - simplified
        if (CONFIG.DEBUG) {
            this.add.text(10, 10, 'DEBUG: Doors visible', {
                fontSize: '10px',
                fill: '#ffff00',
                fontFamily: 'monospace',
                backgroundColor: '#000044',
                padding: { x: 2, y: 1 }
            }).setDepth(100).setScrollFactor(0);
        }

        // Flickering light
        this.flickerOffset = 0;
        this.flickerTimer = 0;

        // Fog dirty-flag tracking
        this._fogDirty = true;
        this._lastFogTileX = -1;
        this._lastFogTileY = -1;

        // Render initial tiles
        this._renderWorld();

        // Start ambient audio
        AUDIO.startAmbience();
        AUDIO.startExplorationMusic();
        AUDIO.startHeartbeat(this.corruption.value / CONFIG.CORRUPTION_MAX);
    }

    update(time, delta) {
        if (!this.player.alive) return;

        this.playerLabel.setPosition(this.player.sprite.x, this.player.sprite.y - 14);

        // Update player light position
        if (this.playerLight) {
            this.playerLight.setPosition(this.player.sprite.x, this.player.sprite.y);
            // Flicker the light intensity slightly for atmosphere
            const flickerIntensity = this.panicState.active ? 0.04 : 0.02;
            this.playerLight.intensity = 0.15 + (Math.random() - 0.5) * flickerIntensity;
            // Red shift during high corruption
            const corruptionPct = this.corruption ? this.corruption.value / CONFIG.CORRUPTION_MAX : 0;
            if (corruptionPct > 0.5) {
                const redShift = (corruptionPct - 0.5) * 2; // 0 to 1
                const r = 0xff;
                const g = Math.floor(0xe8 * (1 - redShift * 0.5));
                const b = Math.floor(0xcc * (1 - redShift * 0.8));
                this.playerLight.color.setTo(r, g, b);
            }
        }

        // Update player
        this.player.update(delta, this.dungeon);

        // Update enemies
        this.enemyManager.update(delta, this.player, this.dungeon);

        // Update combat
        this.combatSystem.update(delta, this.player, this.enemyManager, this.corruption);

        // Update corruption
        const shouldPanic = this.corruption.update(delta, this.player);

        // Update particles
        this.particles.update(delta);

        // Corruption wisps at high corruption
        if (this.corruption.value > 40 && Math.random() < 0.1) {
            this.particles.corruptionWisps(
                this.player.sprite.x, this.player.sprite.y,
                this.corruption.value / CONFIG.CORRUPTION_MAX
            );
        }

        // Check for panic event triggers
        if (shouldPanic && !this.panicState.active) {
            const currentRoom = this.dungeon.getRoomAt(this.player.sprite.x, this.player.sprite.y);
            if (currentRoom && currentRoom.type !== 'start') {
                this._startPanicEvent(currentRoom);
            } else {
                // Block panic in start room but still set flag to avoid per-frame retrigger
                this.corruption.setPanicTriggered();
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

        // Flickering light update
        this.flickerTimer += delta;
        if (this.flickerTimer > 80) {
            this.flickerTimer = 0;
            // Subtle random flicker in visibility radius (±8px)
            const intensity = this.panicState.active ? 16 : 8;
            this.flickerOffset = (Math.random() - 0.5) * intensity;
            this._fogDirty = true;
        }

        // Render fog/wall overlays only when dirty (player moved >= 1 tile or flicker changed)
        const playerTileX = Math.floor(this.player.sprite.x / CONFIG.TILE_SIZE);
        const playerTileY = Math.floor(this.player.sprite.y / CONFIG.TILE_SIZE);
        if (this._fogDirty || playerTileX !== this._lastFogTileX || playerTileY !== this._lastFogTileY) {
            this._renderWorld();
            this._renderWallOverlay();
            this._lastFogTileX = playerTileX;
            this._lastFogTileY = playerTileY;
            this._fogDirty = false;
        }

        // Periodic enemy cleanup
        if (time % 5000 < 20) {
            this.enemyManager.cleanup();
        }
    }

    _renderWorld() {
        const g = this.fogGraphics;
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
        const visRadius = CONFIG.VISIBILITY_RADIUS + (this.flickerOffset || 0);
        const fogRadius = CONFIG.FOG_RADIUS + (this.flickerOffset || 0);

        for (let y = startTileY; y < endTileY; y++) {
            for (let x = startTileX; x < endTileX; x++) {
                const tile = this.dungeon.getTile(x, y);
                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;
                const cx = px + CONFIG.TILE_SIZE / 2;
                const cy = py + CONFIG.TILE_SIZE / 2;
                const dist = Phaser.Math.Distance.Between(playerX, playerY, cx, cy);

                // Overlay darkness (balanced, with flicker)
                if (!tile.explored) {
                    let alpha = 0.82;
                    if (dist <= visRadius) {
                        alpha = 0.42;
                    } else if (dist <= fogRadius) {
                        alpha = 0.65;
                    }
                    g.fillStyle(0x000000, alpha);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                } else if (dist > fogRadius) {
                    g.fillStyle(0x000000, 0.55);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                } else if (dist > visRadius) {
                    const alpha = 0.15 + ((dist - visRadius) / (fogRadius - visRadius)) * 0.3;
                    g.fillStyle(0x000000, alpha);
                    g.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                }
            }
        }
    }

    _buildTileMap(worldW, worldH) {
        this.tileRT = this.add.renderTexture(0, 0, worldW, worldH);
        this.tileRT.setOrigin(0, 0);
        this.tileRT.setDepth(1);

        const ts = CONFIG.TILE_SIZE;
        const getAdjacentRoom = this._getAdjacentRoom.bind(this);

        for (let y = 0; y < this.dungeon.height; y++) {
            for (let x = 0; x < this.dungeon.width; x++) {
                const tile = this.dungeon.getTile(x, y);
                const texKey = TILE_SPRITE_GEN.getTextureKey(tile, getAdjacentRoom, x, y);
                this.tileRT.drawFrame(texKey, undefined, x * ts, y * ts);
            }
        }
    }

    _renderWallOverlay() {
        const g = this.wallOverlayGraphics;
        g.clear();

        const playerTileX = Math.floor(this.player.sprite.x / CONFIG.TILE_SIZE);
        const playerTileY = Math.floor(this.player.sprite.y / CONFIG.TILE_SIZE);
        const radiusTiles = Math.ceil(CONFIG.VISIBILITY_RADIUS / CONFIG.TILE_SIZE) + 2;
        const wallVisRadius = CONFIG.VISIBILITY_RADIUS + (this.flickerOffset || 0);
        const wallFogRadius = CONFIG.FOG_RADIUS + (this.flickerOffset || 0);

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

                if (dist > wallFogRadius + CONFIG.TILE_SIZE * 2) continue;

                const t = Phaser.Math.Clamp((dist - wallVisRadius) / Math.max(1, (wallFogRadius - wallVisRadius)), 0, 1);
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
        const visRadius = CONFIG.VISIBILITY_RADIUS + (this.flickerOffset || 0);
        const fogRadius = CONFIG.FOG_RADIUS + (this.flickerOffset || 0);

        const getVisibilityAlpha = (x, y) => {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, x, y);
            const tileX = Math.floor(x / CONFIG.TILE_SIZE);
            const tileY = Math.floor(y / CONFIG.TILE_SIZE);
            const tile = this.dungeon.getTile(tileX, tileY);

            if (!tile.explored) {
                return dist <= visRadius ? 0.2 : 0;
            }
            if (dist <= visRadius) return 1;
            if (dist >= fogRadius) return 0.2;

            const t = (dist - visRadius) / Math.max(1, (fogRadius - visRadius));
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
        const rooms = this.dungeon.rooms;
        const totalRooms = rooms.filter(r => r.type !== 'start').length;
        let roomIndex = 0;

        for (const room of rooms) {
            if (room.type === 'start') continue;
            roomIndex++;

            // Difficulty scales with room distance from start (0.0-1.0)
            const progress = roomIndex / totalRooms;
            const diffMult = 1 + progress * 1.5; // 1.0 to 2.5

            if (room.type === 'boss') {
                // Spawn mini-boss in boss room
                this.enemyManager.spawnMiniBoss(room, diffMult);
                // Add a couple guards
                this.enemyManager.spawnInRoom(room, 2, null, diffMult);
                continue;
            }

            const count = Phaser.Math.Between(1, 3);
            this.enemyManager.spawnInRoom(room, count, null, diffMult);
        }
    }

    _createItemSprites() {
        for (const spawn of this.dungeon.itemSpawns) {
            const px = spawn.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = spawn.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            this._createItemSpriteAt(spawn, px, py);
        }
    }

    _createDoorSprites() {
        if (CONFIG.DEBUG) {
            console.log('Creating door sprites for', this.dungeon.doors.length, 'doors');
        }
        
        for (const door of this.dungeon.doors) {
            const px = door.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = door.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            const texKey = TILE_SPRITE_GEN.getDoorTextureKey(door.type);

            let sprite;
            if (this.textures.exists(texKey)) {
                sprite = this.add.sprite(px, py, texKey);
            } else {
                // Fallback to colored rectangle with distinct colors
                let color;
                if (door.type === 'locked') color = 0xFF4444; // Bright red for locked
                else if (door.type === 'shortcut') color = 0x4444FF; // Blue for shortcut
                else if (door.type === 'sealed') color = 0x996633; // Brown for sealed
                else color = 0x44AA44; // Green for normal
                sprite = this.add.rectangle(px, py, CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4, color);
                sprite.setStrokeStyle(2, 0xFFFFFF); // White border
            }
            sprite.setDepth(55);
            sprite.setData('door', door);
            
            // Create proper door label
            let labelText;
            if (door.type === 'locked') labelText = '🔒';
            else if (door.type === 'shortcut') labelText = '⇄';
            else if (door.type === 'sealed') labelText = '❌';
            else labelText = '➤';
            
            const label = this._createWorldLabel(px, py - 12, labelText, '#ffdd88');
            sprite.setData('label', label);

            // In normal mode only show closed doors; in debug mode show all
            const showDoor = CONFIG.DEBUG ? true : !door.open;
            sprite.setVisible(showDoor);
            label.setVisible(showDoor);
            // If door is open, make it semi-transparent
            if (door.open) {
                sprite.setAlpha(0.6);
                if (typeof sprite.setTint === 'function') {
                    sprite.setTint(0x88ff88); // Green tint for open doors (sprites)
                } else if (typeof sprite.setFillStyle === 'function') {
                    sprite.setFillStyle(0x88ff88); // Green fill for open doors (rectangles)
                    if (typeof sprite.setStrokeStyle === 'function') {
                        sprite.setStrokeStyle(2, 0xFFFFFF);
                    }
                }
            }
            this.doorSprites.push(sprite);

            if (CONFIG.DEBUG) {
                console.log(`Door sprite created at (${door.x}, ${door.y}) type: ${door.type}`);
            }
        }
    }

    _createFurnitureSprites() {
        for (const furniture of this.dungeon.furniture) {
            const px = furniture.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const py = furniture.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            const texKey = `tile_${furniture.type}`;
            
            let sprite;
            if (this.textures.exists(texKey)) {
                sprite = this.add.sprite(px, py, texKey);
            } else {
                // Fallback to colored rectangle if texture doesn't exist
                sprite = this.add.rectangle(px, py, CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2, 0x888888);
            }
            
            sprite.setDepth(10); // Render furniture above floor but below items/enemies
            sprite.setData('furniture', furniture);
            
            // Add collision if it's a blocking piece of furniture
            if (this._isFurnitureBlocking(furniture.type)) {
                this.blockingFurnitureGroup.add(sprite);
                if (sprite.body) {
                    sprite.body.setSize(CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2);
                    sprite.body.updateFromGameObject();
                }
            }
            
            this.furnitureSprites.push(sprite);
        }

        // Single collider is cheaper than per-sprite colliders
        if (this.blockingFurnitureGroup.getLength() > 0) {
            this.furnitureCollider = this.physics.add.collider(this.player.sprite, this.blockingFurnitureGroup);
        }
    }

    _isFurnitureBlocking(furnitureType) {
        // Define which furniture types should block movement
        const blockingTypes = [
            'desk', 'computer_desk', 'filing_cabinet', 'bookshelf', 
            'conference_table', 'water_cooler', 'copy_machine', 'coffee_machine',
            'safe', 'vending_machine', 'whiteboard'
        ];
        return blockingTypes.includes(furnitureType);
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
                    } else if (item.type === 'passive') {
                        // Auto-pickup passive items
                        picked = this.player.addPassiveItem(item.passiveKey);
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
                        AUDIO.playPickup();
                        // Pickup sparkle
                        if (this.particles) {
                            let sparkleColor = 0xffffff;
                            if (spawn.type === 'health') sparkleColor = 0xff4444;
                            else if (spawn.type === 'key') sparkleColor = 0xffff44;
                            else if (spawn.type.startsWith('ammo')) sparkleColor = 0xffcc44;
                            else if (spawn.type.startsWith('weapon')) sparkleColor = 0x44ccff;
                            else if (spawn.type.startsWith('passive')) sparkleColor = 0xff88ff;
                            this.particles.pickupSparkle(sprite.x, sprite.y, sparkleColor);
                        }
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
            case 'weapon_chainsaw':
                return { type: 'weapon', name: 'Chainsaw', weapon: CONFIG.WEAPONS.CHAINSAW, durability: 50 };
            case 'grenade':
                return { type: 'weapon', name: 'Grenade', weapon: CONFIG.WEAPONS.GRENADE };
            default:
                // Handle passive items
                if (spawn.type.startsWith('passive_')) {
                    const pKey = spawn.type.replace('passive_', '');
                    const p = CONFIG.PASSIVE_ITEMS[pKey];
                    if (p) return { type: 'passive', name: p.name, passiveKey: pKey };
                }
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
                        if (sprite.setTexture) {
                            sprite.setTexture(TILE_SPRITE_GEN.getDoorTextureKey(door.type));
                        } else if (sprite.setFillStyle) {
                            sprite.setFillStyle(0x44AA44);
                        }
                        this._applyDoorOpenVisual(sprite, '[OPEN]');
                        AUDIO.playDoorOpen();
                    }
                } else if (door.type === 'shortcut') {
                    // One-way: only opens from the source room side
                    const playerRoom = this.dungeon.getRoomAt(this.player.sprite.x, this.player.sprite.y);
                    if (playerRoom === door.sourceRoom || !door.sourceRoom) {
                        door.open = true;
                        this._applyDoorOpenVisual(sprite, '[SHORTCUT]');
                        AUDIO.playDoorOpen();
                    }
                } else if (door.type === 'normal' && !door.room.doorsSealed) {
                    door.open = true;
                    this._applyDoorOpenVisual(sprite, '[OPEN]');
                    AUDIO.playDoorOpen();
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
                if (sprite.setTexture) {
                    sprite.setTexture('tile_door_sealed');
                } else if (sprite.setFillStyle) {
                    sprite.setFillStyle(CONFIG.COLORS.DOOR_SEALED);
                }
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

        // Audio: sealed doors + panic music
        AUDIO.playDoorSeal();
        AUDIO.startPanicMusic();

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
        const reduction = META.getPanicEnemyReduction();
        const count = Math.max(1, Math.floor(CONFIG.PANIC_ENEMIES_PER_WAVE * level) - reduction);

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
            const panicDiffMult = 1 + level * 0.3; // escalate speed with corruption level
            const enemy = this.enemyManager.spawnAtPosition(x, y, type, panicDiffMult);
            // Add new enemy to physics group for overlap detection
            if (enemy && enemy.sprite && this.enemySpriteGroup) {
                this.enemySpriteGroup.add(enemy.sprite);
            }
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
                        AUDIO.playPanicWave();
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

        // Switch back to exploration music
        AUDIO.startExplorationMusic();

        // Unseal doors
        room.doorsSealed = false;
        for (const sprite of this.doorSprites) {
            const door = sprite.getData('door');
            if (door.room === room) {
                door.open = true;
                if (sprite.setTexture) {
                    sprite.setTexture(TILE_SPRITE_GEN.getDoorTextureKey(door.type));
                } else if (sprite.setFillStyle) {
                    sprite.setFillStyle(CONFIG.COLORS.DOOR);
                }
                this._applyDoorOpenVisual(sprite, '[OPEN]');
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
            this._createItemSpriteAt(spawn, px, py);
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

        // Build pool of possible evolutions
        const pool = [
            { key: 'melee_frenzy', label: 'FRENZY MODE', desc: '2x attack speed, 1.5x melee damage' },
            { key: 'melee_slam', label: 'SLAM MODE', desc: '3x melee damage, slower swings' },
            { key: 'berserker', label: 'BERSERKER', desc: '2x speed both weapons, 50% damage taken' },
        ];

        if (this.player.rangedWeapon) {
            pool.push({ key: 'ranged_spread', label: 'SPREAD SHOT', desc: 'Triple projectile spread' });
            pool.push({ key: 'ranged_piercing', label: 'PIERCING ROUNDS', desc: '2x ranged damage' });
        }

        // Weapon-specific evolutions (synergy)
        const meleeW = this.player.meleeWeapon;
        if (meleeW.name === 'Chainsaw') {
            pool.push({ key: 'chainsaw_rampage', label: 'RAMPAGE', desc: 'Chainsaw heals 5 HP per hit' });
        }
        if (meleeW.name === 'Knife') {
            pool.push({ key: 'knife_assassin', label: 'ASSASSIN', desc: '4x damage from behind, double speed' });
        }
        if (this.player.rangedWeapon && this.player.rangedWeapon.name === 'Shotgun') {
            pool.push({ key: 'shotgun_inferno', label: 'INFERNO SHELLS', desc: '5-way spread, 2x damage' });
        }

        // Passive synergy evolutions
        const passiveKeys = this.player.passiveItems.map(p => p.key);
        if (passiveKeys.includes('BLOOD_PACT') && passiveKeys.includes('ADRENALINE')) {
            pool.push({ key: 'synergy_bloodrush', label: 'BLOOD RUSH', desc: '3x melee damage, 40% faster, heal on kill' });
        }
        if (passiveKeys.includes('IRON_BOOTS') && passiveKeys.includes('THICK_SKIN')) {
            pool.push({ key: 'synergy_fortress', label: 'FORTRESS', desc: '75% damage reduction, AoE knockback on hit' });
        }

        // Pick 3 random options from pool
        Phaser.Utils.Array.Shuffle(pool);
        const choices = pool.slice(0, Math.min(3, pool.length));

        // Show choice UI — pause game actions
        this._showEvolutionChoiceUI(choices);
    }

    _showEvolutionChoiceUI(choices) {
        // Semi-transparent overlay
        const overlay = this.add.rectangle(
            this.cameras.main.scrollX + CONFIG.GAME_WIDTH / 2,
            this.cameras.main.scrollY + CONFIG.GAME_HEIGHT / 2,
            CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x000000, 0.6
        ).setDepth(300).setScrollFactor(0).setOrigin(0.5);

        const title = this.add.text(
            CONFIG.GAME_WIDTH / 2, 80,
            'CHOOSE EVOLUTION', {
                fontSize: '18px', fill: '#ffcc00', fontFamily: 'monospace',
                stroke: '#000000', strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(301).setScrollFactor(0);

        const uiGroup = [overlay, title];
        const cardWidth = 200;
        const startX = CONFIG.GAME_WIDTH / 2 - (choices.length - 1) * (cardWidth + 20) / 2;

        choices.forEach((choice, i) => {
            const cx = startX + i * (cardWidth + 20);
            const cy = CONFIG.GAME_HEIGHT / 2 - 20;

            const card = this.add.rectangle(cx, cy, cardWidth, 140, 0x222244, 0.9)
                .setStrokeStyle(2, 0xffcc00).setDepth(301).setScrollFactor(0)
                .setInteractive({ useHandCursor: true });

            const nameText = this.add.text(cx, cy - 40, choice.label, {
                fontSize: '14px', fill: '#ffdd44', fontFamily: 'monospace',
                align: 'center', stroke: '#000000', strokeThickness: 1
            }).setOrigin(0.5).setDepth(302).setScrollFactor(0);

            const descText = this.add.text(cx, cy + 10, choice.desc, {
                fontSize: '10px', fill: '#cccccc', fontFamily: 'monospace',
                align: 'center', wordWrap: { width: cardWidth - 20 },
                stroke: '#000000', strokeThickness: 1
            }).setOrigin(0.5).setDepth(302).setScrollFactor(0);

            uiGroup.push(card, nameText, descText);

            card.on('pointerover', () => card.setStrokeStyle(3, 0xffffff));
            card.on('pointerout', () => card.setStrokeStyle(2, 0xffcc00));
            card.on('pointerdown', () => {
                // Clean up UI
                uiGroup.forEach(el => el.destroy());
                // Apply chosen evolution
                this._applyChosenEvolution(choice.key, choice.label);
            });
        });
    }

    _applyChosenEvolution(key, label) {
        AUDIO.playEvolution();
        this.panicState.evolution = key;
        this.panicState.evolutionName = label;

        switch (key) {
            case 'melee_frenzy':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, speed: this.player.meleeWeapon.speed * 0.5, damage: Math.floor(this.player.meleeWeapon.damage * 1.5) };
                break;
            case 'melee_slam':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, speed: this.player.meleeWeapon.speed * 1.5, damage: Math.floor(this.player.meleeWeapon.damage * 3) };
                break;
            case 'ranged_spread':
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, spread: (this.player.rangedWeapon.spread || 1) * 3 };
                }
                break;
            case 'ranged_piercing':
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, damage: Math.floor(this.player.rangedWeapon.damage * 2) };
                }
                break;
            case 'berserker':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, speed: this.player.meleeWeapon.speed * 0.5, damage: Math.floor(this.player.meleeWeapon.damage * 1.3) };
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, speed: this.player.rangedWeapon.speed * 0.5 };
                }
                this.panicState.berserkerActive = true;
                break;
            case 'chainsaw_rampage':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, damage: Math.floor(this.player.meleeWeapon.damage * 1.5) };
                this.panicState.healOnMelee = 5;
                break;
            case 'knife_assassin':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, damage: Math.floor(this.player.meleeWeapon.damage * 4), speed: this.player.meleeWeapon.speed * 0.5 };
                break;
            case 'shotgun_inferno':
                if (this.player.rangedWeapon) {
                    this.player.rangedWeapon = { ...this.player.rangedWeapon, spread: 5, damage: Math.floor(this.player.rangedWeapon.damage * 2) };
                }
                break;
            case 'synergy_bloodrush':
                this.player.meleeWeapon = { ...this.player.meleeWeapon, damage: Math.floor(this.player.meleeWeapon.damage * 3), speed: this.player.meleeWeapon.speed * 0.6 };
                this.panicState.healOnMelee = 8;
                break;
            case 'synergy_fortress':
                this.panicState.fortressActive = true;
                break;
        }

        // Visual flash for evolution
        this.cameras.main.flash(150, 255, 200, 0);
    }

    _revertWeaponEvolution() {
        if (!this.panicState.originalMelee) return;

        // Restore original melee weapon from saved snapshot
        if (this.player.activeMeleeSlot === -1) {
            this.player.meleeWeapon = CONFIG.WEAPONS.FISTS;
        } else {
            // Use the saved original stats, not the (possibly modified) inventory reference
            this.player.meleeWeapon = { ...this.panicState.originalMelee };
            const item = this.player.inventory[this.player.activeMeleeSlot];
            if (item && item.weapon) {
                item.weapon = this.player.meleeWeapon;
            }
        }

        // Restore ranged from saved snapshot
        if (this.player.activeRangedSlot >= 0) {
            if (this.panicState.originalRanged) {
                this.player.rangedWeapon = { ...this.panicState.originalRanged };
                const item = this.player.inventory[this.player.activeRangedSlot];
                if (item && item.weapon) {
                    item.weapon = this.player.rangedWeapon;
                }
            } else {
                this.player.rangedWeapon = null;
            }
        } else {
            this.player.rangedWeapon = null;
        }

        this.panicState.berserkerActive = false;
        this.panicState.healOnMelee = 0;
        this.panicState.fortressActive = false;
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

            // All enemies in boss room must be dead
            const aliveInBossRoom = this.enemyManager.getAliveEnemies().filter(e => {
                const ex = Math.floor(e.sprite.x / CONFIG.TILE_SIZE);
                const ey = Math.floor(e.sprite.y / CONFIG.TILE_SIZE);
                return ex >= bossRoom.x && ex < bossRoom.x + bossRoom.width &&
                       ey >= bossRoom.y && ey < bossRoom.y + bossRoom.height;
            });
            if (aliveInBossRoom.length > 0) return;

            this._won = true;
            this.cameras.main.flash(500, 0, 80, 0);
            this.time.delayedCall(1500, () => {
                this.scene.stop('HUDScene');
                this.scene.start('VictoryScene', { stats: this.player.stats });
            });
        }
    }

    // --- Physics overlap callback: projectile hits enemy ---
    _onProjectileHitEnemy(projectileSprite, enemySprite) {
        if (!projectileSprite.active || !enemySprite.active) return;

        const enemy = enemySprite.getData('enemy');
        if (!enemy || !enemy.alive) return;

        // Find the projectile data from combat system
        const projData = this.combatSystem.projectiles.find(
            p => p.sprite === projectileSprite && p.alive
        );
        if (!projData) return;

        // Deal damage
        enemy.takeDamage(projData.damage);
        if (!enemy.alive) {
            this.player.stats.enemiesKilled++;
        }
        this.player.stats.damageDealt += projData.damage;

        // Particle effects
        if (this.particles) {
            this.particles.hitSpark(projectileSprite.x, projectileSprite.y);
            this.particles.bloodSplatter(projectileSprite.x, projectileSprite.y, 3);
        }

        // Deactivate projectile (return to pool)
        projData.alive = false;
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

        this._createItemSpriteAt(spawn, worldX, worldY);
    }

    // --- Shared helper: create an item sprite at world coords, add to itemSprites array ---
    _createItemSpriteAt(spawn, px, py) {
        const texKey = ITEM_SPRITE_GEN.getTextureKey(spawn.type);
        let sprite;
        if (texKey && this.textures.exists(texKey)) {
            sprite = this.add.sprite(px, py, texKey);
            sprite.setDisplaySize(12, 12);
        } else {
            let color;
            if (spawn.type === 'health') color = CONFIG.COLORS.ITEM_HEALTH;
            else if (spawn.type === 'key') color = CONFIG.COLORS.ITEM_KEY;
            else if (spawn.type.startsWith('ammo')) color = CONFIG.COLORS.ITEM_AMMO;
            else if (spawn.type.startsWith('weapon')) color = CONFIG.COLORS.ITEM_WEAPON;
            else if (spawn.type.startsWith('passive')) color = CONFIG.COLORS.ITEM_PASSIVE;
            else if (spawn.type === 'repair_kit') color = 0x88ff88;
            else color = 0x888888;
            sprite = this.add.rectangle(px, py, 8, 8, color);
        }
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

        return sprite;
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
        if (type.startsWith('passive_')) {
            const pKey = type.replace('passive_', '');
            const p = CONFIG.PASSIVE_ITEMS[pKey];
            return p ? p.name.toUpperCase() : 'PASSIVE';
        }
        return labels[type] || 'ITEM';
    }

    _getDoorLabel(type) {
        if (type === 'locked') return 'DOOR 🔒';
        if (type === 'sealed') return 'SEALED ❌';
        if (type === 'shortcut') return 'SHORTCUT ⇄';
        return 'DOOR ➤';
    }

    _applyDoorOpenVisual(sprite, openLabel) {
        sprite.setAlpha(0.5);
        if (typeof sprite.setTint === 'function') {
            sprite.setTint(0x88ff88);
        } else {
            if (typeof sprite.setFillStyle === 'function') {
                sprite.setFillStyle(0x88ff88);
            }
            if (typeof sprite.setStrokeStyle === 'function') {
                sprite.setStrokeStyle(2, 0xFFFFFF);
            }
        }

        const showDoor = CONFIG.DEBUG;
        sprite.setVisible(showDoor);

        const label = sprite.getData('label');
        if (label) {
            label.setText(openLabel);
            label.setVisible(showDoor);
        }
    }

    // --- Cleanup on scene transition to prevent memory leaks ---
    shutdown() {
        if (this._shuttingDown) return;
        this._shuttingDown = true;

        // Clean up particles
        if (this.particles) this.particles.cleanup();

        // Clean up combat projectiles
        if (this.combatSystem) this.combatSystem.cleanup();

        // Clean up enemy display objects
        for (const enemy of this.enemyManager.enemies) {
            if (enemy.label) enemy.label.destroy();
            if (enemy.hpBarBg) enemy.hpBarBg.destroy();
            if (enemy.hpBarFg) enemy.hpBarFg.destroy();
            if (enemy.sprite) enemy.sprite.destroy();
        }
        this.enemyManager.enemies = [];

        // Clean up item labels
        for (const sprite of this.itemSprites) {
            const label = sprite.getData('label');
            if (label) label.destroy();
        }
        this.itemSprites = [];

        // Clean up door labels
        for (const sprite of this.doorSprites) {
            const label = sprite.getData('label');
            if (label) label.destroy();
        }
        this.doorSprites = [];

        // Clean up furniture sprites
        if (this.furnitureSprites) {
            for (const sprite of this.furnitureSprites) {
                if (sprite) sprite.destroy();
            }
            this.furnitureSprites = [];
        }

        if (this.furnitureCollider) {
            this.furnitureCollider.destroy();
            this.furnitureCollider = null;
        }

        if (this.blockingFurnitureGroup) {
            this.blockingFurnitureGroup.destroy(false);
            this.blockingFurnitureGroup = null;
        }

        // Clean up player label
        if (this.playerLabel) this.playerLabel.destroy();

        // Clean up player light
        if (this.playerLight) this.playerLight.destroy();

        // Clean up graphics
        if (this.fogGraphics) this.fogGraphics.destroy();
        if (this.wallOverlayGraphics) this.wallOverlayGraphics.destroy();
        if (this.tileRT) this.tileRT.destroy();

        // Stop all audio
        AUDIO.stopAll();
    }
}

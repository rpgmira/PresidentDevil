// ============================================
// President Devil — Procedural Dungeon Generator
// ============================================

class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.centerX = Math.floor(x + width / 2);
        this.centerY = Math.floor(y + height / 2);
        this.type = 'normal'; // normal, start, event, locked, boss
        this.connected = [];
        this.explored = false;
        this.doorsSealed = false;
    }

    intersects(other, padding = 1) {
        return (
            this.x - padding < other.x + other.width &&
            this.x + this.width + padding > other.x &&
            this.y - padding < other.y + other.height &&
            this.y + this.height + padding > other.y
        );
    }
}

class Dungeon {
    constructor() {
        this.width = CONFIG.DUNGEON_WIDTH;
        this.height = CONFIG.DUNGEON_HEIGHT;
        this.tiles = [];
        this.rooms = [];
        this.doors = [];
        this.itemSpawns = [];
    }

    generate() {
        // Initialize all tiles as walls
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = { type: 'wall', explored: false };
            }
        }

        // Generate rooms
        this.rooms = [];
        let attempts = 0;
        while (this.rooms.length < CONFIG.MAX_ROOMS && attempts < 200) {
            const w = Phaser.Math.Between(CONFIG.MIN_ROOM_SIZE, CONFIG.MAX_ROOM_SIZE);
            const h = Phaser.Math.Between(CONFIG.MIN_ROOM_SIZE, CONFIG.MAX_ROOM_SIZE);
            const x = Phaser.Math.Between(1, this.width - w - 1);
            const y = Phaser.Math.Between(1, this.height - h - 1);

            const newRoom = new Room(x, y, w, h);
            let overlaps = false;
            for (const room of this.rooms) {
                if (newRoom.intersects(room, 2)) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                this.rooms.push(newRoom);
                this._carveRoom(newRoom);
            }
            attempts++;
        }

        // Connect rooms with corridors
        for (let i = 1; i < this.rooms.length; i++) {
            const roomA = this.rooms[i - 1];
            const roomB = this.rooms[i];
            this._carveCorridor(roomA, roomB);
            roomA.connected.push(roomB);
            roomB.connected.push(roomA);
        }

        // Assign room types
        this._assignRoomTypes();

        // Place doors at corridor-room transitions
        this._placeDoors();

        // Place shortcut doors (one-way connections between non-adjacent rooms)
        this._placeShortcuts();

        // Place item spawns
        this._placeItems();

        return this;
    }

    _carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                    this.tiles[y][x] = { type: 'floor', explored: false, room: room };
                }
            }
        }
    }

    _carveCorridor(roomA, roomB) {
        let x = roomA.centerX;
        let y = roomA.centerY;
        const targetX = roomB.centerX;
        const targetY = roomB.centerY;

        // Randomly choose horizontal-first or vertical-first
        if (Phaser.Math.Between(0, 1) === 0) {
            // Horizontal then vertical
            while (x !== targetX) {
                x += (targetX > x) ? 1 : -1;
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.tiles[y][x] = { type: 'floor', explored: false, corridor: true };
                }
            }
            while (y !== targetY) {
                y += (targetY > y) ? 1 : -1;
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.tiles[y][x] = { type: 'floor', explored: false, corridor: true };
                }
            }
        } else {
            // Vertical then horizontal
            while (y !== targetY) {
                y += (targetY > y) ? 1 : -1;
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.tiles[y][x] = { type: 'floor', explored: false, corridor: true };
                }
            }
            while (x !== targetX) {
                x += (targetX > x) ? 1 : -1;
                if (this.tiles[y] && this.tiles[y][x]) {
                    this.tiles[y][x] = { type: 'floor', explored: false, corridor: true };
                }
            }
        }
    }

    _assignRoomTypes() {
        if (this.rooms.length === 0) return;

        // First room is start
        this.rooms[0].type = 'start';

        // Last room is boss/exit
        if (this.rooms.length > 1) {
            this.rooms[this.rooms.length - 1].type = 'boss';
        }

        // Randomly assign event rooms (30% chance for middle rooms)
        for (let i = 1; i < this.rooms.length - 1; i++) {
            const roll = Math.random();
            if (roll < 0.3) {
                this.rooms[i].type = 'event';
            } else if (roll < 0.4) {
                this.rooms[i].type = 'locked';
            }
        }
    }

    _placeDoors() {
        this.doors = [];
        // Find transitions between corridors and rooms
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                const tile = this.tiles[y][x];
                if (tile.type !== 'floor' || !tile.corridor) continue;

                // Check if this corridor tile is adjacent to a room tile
                const neighbors = [
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                ];

                for (const n of neighbors) {
                    const nx = x + n.dx;
                    const ny = y + n.dy;
                    const neighbor = this.tiles[ny] && this.tiles[ny][nx];
                    if (neighbor && neighbor.type === 'floor' && neighbor.room) {
                        // Check if there's a wall on the perpendicular sides (door frame)
                        const isHorizontal = n.dx !== 0;
                        let hasDoorFrame = false;
                        if (isHorizontal) {
                            hasDoorFrame = (
                                this.tiles[y - 1][x].type === 'wall' &&
                                this.tiles[y + 1][x].type === 'wall'
                            );
                        } else {
                            hasDoorFrame = (
                                this.tiles[y][x - 1].type === 'wall' &&
                                this.tiles[y][x + 1].type === 'wall'
                            );
                        }

                        if (hasDoorFrame) {
                            const room = neighbor.room;
                            const doorType = (
                                (room.type === 'locked' || room.type === 'boss') &&
                                this.rooms.indexOf(room) > 0
                            ) ? 'locked' : 'normal';
                            // Avoid duplicate doors at same position
                            const exists = this.doors.some(d => d.x === x && d.y === y);
                            if (!exists) {
                                this.doors.push({
                                    x, y,
                                    type: doorType,
                                    open: doorType === 'normal',
                                    room: room
                                });
                                this.tiles[y][x].door = true;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    _placeShortcuts() {
        // Create 1-2 one-way shortcuts between non-adjacent rooms
        // These are doors that only open from one side (closer room → farther room)
        if (this.rooms.length < 5) return;

        const shortcuts = Phaser.Math.Between(1, 2);
        for (let s = 0; s < shortcuts; s++) {
            // Pick two rooms that aren't directly connected
            const attempts = 20;
            for (let a = 0; a < attempts; a++) {
                const r1idx = Phaser.Math.Between(1, this.rooms.length - 2);
                const r2idx = Phaser.Math.Between(r1idx + 2, Math.min(r1idx + 4, this.rooms.length - 1));
                if (r2idx >= this.rooms.length) continue;

                const r1 = this.rooms[r1idx];
                const r2 = this.rooms[r2idx];

                // Find closest wall points between the two rooms
                // Carve a short corridor and place a one-way door
                const dx = r2.centerX - r1.centerX;
                const dy = r2.centerY - r1.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 25 || dist < 8) continue; // too far or too close

                // Carve shortcut corridor from r1 edge toward r2
                let sx = r1.centerX;
                let sy = r1.centerY;
                const tx = r2.centerX;
                const ty = r2.centerY;

                // Carve path
                while (sx !== tx) {
                    sx += (tx > sx) ? 1 : -1;
                    if (this.tiles[sy] && this.tiles[sy][sx]) {
                        if (this.tiles[sy][sx].type === 'wall') {
                            this.tiles[sy][sx] = { type: 'floor', explored: false, corridor: true };
                        }
                    }
                }
                while (sy !== ty) {
                    sy += (ty > sy) ? 1 : -1;
                    if (this.tiles[sy] && this.tiles[sy][sx]) {
                        if (this.tiles[sy][sx].type === 'wall') {
                            this.tiles[sy][sx] = { type: 'floor', explored: false, corridor: true };
                        }
                    }
                }

                // Place a shortcut door at the midpoint
                const midX = Math.floor((r1.centerX + r2.centerX) / 2);
                const midY = Math.floor((r1.centerY + r2.centerY) / 2);

                const exists = this.doors.some(d => d.x === midX && d.y === midY);
                if (!exists && this.getTile(midX, midY).type === 'floor') {
                    this.doors.push({
                        x: midX, y: midY,
                        type: 'shortcut',
                        open: false,
                        room: r2,
                        sourceRoom: r1,
                        oneWay: true
                    });
                    this.tiles[midY][midX].door = true;
                }
                break; // placed one shortcut
            }
        }
    }

    _placeItems() {
        this.itemSpawns = [];
        const scavengerBonus = META.getScavengerBonus(); // 0, 0.15, or 0.30
        const _placeKeyBeforeRoom = (room) => {
            const roomIndex = this.rooms.indexOf(room);
            if (roomIndex <= 0) return;
            const priorRoom = this.rooms[roomIndex - 1];
            const kx = Phaser.Math.Between(priorRoom.x + 1, priorRoom.x + priorRoom.width - 2);
            const ky = Phaser.Math.Between(priorRoom.y + 1, priorRoom.y + priorRoom.height - 2);
            this.itemSpawns.push({ x: kx, y: ky, type: 'key', room: priorRoom });
        };
        for (const room of this.rooms) {
            if (room.type === 'start') continue;

            // Scavenger bonus: chance for an extra item per room
            let baseMax = 2;
            if (scavengerBonus > 0 && Math.random() < scavengerBonus) {
                baseMax = 3;
            }
            const itemCount = Phaser.Math.Between(0, baseMax);
            for (let i = 0; i < itemCount; i++) {
                const ix = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
                const iy = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);

                // Decide item type
                const roll = Math.random();
                let itemType;
                if (roll < 0.4) itemType = 'health';
                else if (roll < 0.5) itemType = 'ammo_pistol';
                else if (roll < 0.6) itemType = 'ammo_shotgun';
                else if (roll < 0.65) itemType = 'ammo_crossbow';
                else if (roll < 0.72) itemType = 'weapon_knife';
                else if (roll < 0.79) itemType = 'weapon_bat';
                else if (roll < 0.84) itemType = 'weapon_handgun';
                else if (roll < 0.87) itemType = 'weapon_shotgun';
                else if (roll < 0.89) itemType = 'weapon_chainsaw';
                else if (roll < 0.91) itemType = 'grenade';
                else if (roll < 0.94) itemType = 'key';
                else if (roll < 0.96) itemType = 'repair_kit';
                else if (roll < 0.98) {
                    // Random passive item
                    const passiveKeys = Object.keys(CONFIG.PASSIVE_ITEMS);
                    itemType = 'passive_' + passiveKeys[Math.floor(Math.random() * passiveKeys.length)];
                }
                else itemType = 'weapon_crossbow';

                this.itemSpawns.push({ x: ix, y: iy, type: itemType, room: room });
            }

            // Locked rooms always have a key somewhere in a prior room
            if (room.type === 'locked') {
                _placeKeyBeforeRoom(room);
            }

            // Boss/escape room requires a key: place it in the previous room
            if (room.type === 'boss') {
                _placeKeyBeforeRoom(room);
            }
        }
    }

    getTile(x, y) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            return this.tiles[y][x];
        }
        return { type: 'wall' };
    }

    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        if (tile.type !== 'floor') return false;
        // Check for closed/locked doors
        if (tile.door) {
            const door = this.doors.find(d => d.x === x && d.y === y);
            if (door && !door.open) return false;
        }
        return true;
    }

    getRoomAt(worldX, worldY) {
        const tileX = Math.floor(worldX / CONFIG.TILE_SIZE);
        const tileY = Math.floor(worldY / CONFIG.TILE_SIZE);
        const tile = this.getTile(tileX, tileY);
        return tile.room || null;
    }

    revealRoom(room) {
        if (!room || room.explored) return;
        room.explored = true;
        for (let y = room.y - 1; y <= room.y + room.height; y++) {
            for (let x = room.x - 1; x <= room.x + room.width; x++) {
                const tile = this.getTile(x, y);
                if (tile) tile.explored = true;
            }
        }
    }
}

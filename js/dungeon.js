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
                            const doorType = room.type === 'locked' ? 'locked' : 'normal';
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

    _placeItems() {
        this.itemSpawns = [];
        for (const room of this.rooms) {
            if (room.type === 'start') continue;

            const itemCount = Phaser.Math.Between(0, 2);
            for (let i = 0; i < itemCount; i++) {
                const ix = Phaser.Math.Between(room.x + 1, room.x + room.width - 2);
                const iy = Phaser.Math.Between(room.y + 1, room.y + room.height - 2);

                // Decide item type
                const roll = Math.random();
                let itemType;
                if (roll < 0.3) itemType = 'health';
                else if (roll < 0.5) itemType = 'ammo_pistol';
                else if (roll < 0.6) itemType = 'ammo_shotgun';
                else if (roll < 0.65) itemType = 'ammo_crossbow';
                else if (roll < 0.75) itemType = 'weapon_knife';
                else if (roll < 0.82) itemType = 'weapon_bat';
                else if (roll < 0.87) itemType = 'weapon_handgun';
                else if (roll < 0.90) itemType = 'weapon_shotgun';
                else if (roll < 0.93) itemType = 'key';
                else if (roll < 0.96) itemType = 'repair_kit';
                else itemType = 'weapon_crossbow';

                this.itemSpawns.push({ x: ix, y: iy, type: itemType, room: room });
            }

            // Locked rooms always have a key somewhere in a prior room
            if (room.type === 'locked') {
                const priorRoom = this.rooms[Math.max(0, this.rooms.indexOf(room) - 1)];
                const kx = Phaser.Math.Between(priorRoom.x + 1, priorRoom.x + priorRoom.width - 2);
                const ky = Phaser.Math.Between(priorRoom.y + 1, priorRoom.y + priorRoom.height - 2);
                this.itemSpawns.push({ x: kx, y: ky, type: 'key', room: priorRoom });
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

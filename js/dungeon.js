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
        this.furniture = [];
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

        // Ensure critical rooms have doors
        this._ensureCriticalDoors();

        // Place shortcut doors (one-way connections between non-adjacent rooms)
        this._placeShortcuts();

        // Place item spawns
        this._placeItems();

        // Place office furniture
        this._placeFurniture();

        // Place safety equipment in corridors
        this._placeSafetyEquipment();

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
        console.log('=== PLACING DOORS ===');
        console.log(`Dungeon size: ${this.width}x${this.height}`);
        console.log(`Rooms: ${this.rooms.length}`);
        
        // Only place doors at actual room entrances
        for (const room of this.rooms) {
            this._createDoorsForRoom(room);
        }
        
        console.log(`Total doors created: ${this.doors.length}`);
        this.doors.forEach((door, i) => {
            console.log(`Door ${i}: (${door.x}, ${door.y}) type: ${door.type} room: ${door.room ? door.room.type : 'none'}`);
        });
        
        // If we don't have enough doors, create some basic ones
        if (this.doors.length < 2) {
            console.log('Not enough doors, creating additional ones...');
            this._createFallbackDoors();
        }
    }

    _createDoorsForRoom(room) {
        // Find the best entrance point for this room
        // Look for corridor tiles that are directly adjacent to room tiles
        
        const doorType = (room.type === 'boss' || room.type === 'locked') ? 'locked' : 'normal';
        let doorCreated = false;
        
        // Check each edge of the room for potential door locations
        const edges = [
            // Top edge
            ...Array.from({length: room.width}, (_, i) => ({x: room.x + i, y: room.y - 1, entrance: {x: room.x + i, y: room.y}})),
            // Bottom edge  
            ...Array.from({length: room.width}, (_, i) => ({x: room.x + i, y: room.y + room.height, entrance: {x: room.x + i, y: room.y + room.height - 1}})),
            // Left edge
            ...Array.from({length: room.height}, (_, i) => ({x: room.x - 1, y: room.y + i, entrance: {x: room.x, y: room.y + i}})),
            // Right edge
            ...Array.from({length: room.height}, (_, i) => ({x: room.x + room.width, y: room.y + i, entrance: {x: room.x + room.width - 1, y: room.y + i}}))
        ];
        
        for (const edge of edges) {
            if (edge.x >= 0 && edge.x < this.width && edge.y >= 0 && edge.y < this.height) {
                const tile = this.tiles[edge.y][edge.x];
                
                // Must be a corridor tile (not another room)
                if (tile.type === 'floor' && tile.corridor) {
                    // Check if there's already a door here
                    const exists = this.doors.some(d => d.x === edge.x && d.y === edge.y);
                    if (!exists) {
                        this.doors.push({
                            x: edge.x,
                            y: edge.y,
                            type: doorType,
                            open: doorType === 'normal',
                            room: room
                        });
                        this.tiles[edge.y][edge.x].door = true;
                        console.log(`Door created at (${edge.x}, ${edge.y}) for ${room.type} room`);
                        doorCreated = true;
                        break; // Only create one door per room
                    }
                }
            }
        }
        
        if (!doorCreated && (room.type === 'boss' || room.type === 'locked')) {
            console.log(`Warning: Could not create door for ${room.type} room`);
        }
    }

    _createFallbackDoors() {
        // Find room entrances and create doors there
        for (const room of this.rooms) {
            if (this.doors.some(d => d.room === room)) continue; // Skip if room already has a door
            
            // Find corridor tiles adjacent to this room
            for (let y = room.y - 1; y <= room.y + room.height; y++) {
                for (let x = room.x - 1; x <= room.x + room.width; x++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        const tile = this.tiles[y][x];
                        if (tile.type === 'floor' && tile.corridor) {
                            // Check if this is adjacent to the room
                            const adjacent = [
                                {x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1}
                            ];
                            
                            for (const adj of adjacent) {
                                if (adj.x >= room.x && adj.x < room.x + room.width && 
                                    adj.y >= room.y && adj.y < room.y + room.height) {
                                    
                                    const doorType = (room.type === 'boss' || room.type === 'locked') ? 'locked' : 'normal';
                                    const exists = this.doors.some(d => d.x === x && d.y === y);
                                    
                                    if (!exists) {
                                        this.doors.push({
                                            x, y,
                                            type: doorType,
                                            open: doorType === 'normal',
                                            room: room
                                        });
                                        this.tiles[y][x].door = true;
                                        console.log(`Fallback door created at (${x}, ${y}) for ${room.type} room`);
                                        return; // Only create one door per room
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    _ensureCriticalDoors() {
        console.log('=== ENSURING CRITICAL DOORS ===');
        
        // Ensure boss room has a locked door
        const bossRoom = this.rooms.find(r => r.type === 'boss');
        if (bossRoom && !this.doors.some(d => d.room === bossRoom && d.type === 'locked')) {
            this._forceCreateDoorForRoom(bossRoom, 'locked');
        }
        
        // Ensure locked rooms have locked doors
        const lockedRooms = this.rooms.filter(r => r.type === 'locked');
        for (const room of lockedRooms) {
            if (!this.doors.some(d => d.room === room && d.type === 'locked')) {
                this._forceCreateDoorForRoom(room, 'locked');
            }
        }
        
        console.log(`After ensuring critical doors: ${this.doors.length} total doors`);
    }

    _forceCreateDoorForRoom(room, doorType) {
        console.log(`Force creating ${doorType} door for ${room.type} room...`);
        
        // Look around the perimeter of the room for corridor tiles
        const perimeter = [];
        
        // Top and bottom edges
        for (let x = room.x - 1; x <= room.x + room.width; x++) {
            perimeter.push({x, y: room.y - 1}); // Top
            perimeter.push({x, y: room.y + room.height}); // Bottom
        }
        
        // Left and right edges
        for (let y = room.y - 1; y <= room.y + room.height; y++) {
            perimeter.push({x: room.x - 1, y}); // Left
            perimeter.push({x: room.x + room.width, y}); // Right
        }
        
        // Find first valid corridor tile on perimeter
        for (const pos of perimeter) {
            if (pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height) {
                const tile = this.tiles[pos.y][pos.x];
                if (tile.type === 'floor' && (tile.corridor || !tile.room)) {
                    // Check if there's not already a door here
                    const exists = this.doors.some(d => d.x === pos.x && d.y === pos.y);
                    if (!exists) {
                        this.doors.push({
                            x: pos.x,
                            y: pos.y,
                            type: doorType,
                            open: doorType === 'normal',
                            room: room
                        });
                        this.tiles[pos.y][pos.x].door = true;
                        console.log(`Force created ${doorType} door at (${pos.x}, ${pos.y}) for ${room.type} room`);
                        return true;
                    }
                }
            }
        }
        
        console.log(`Could not force create door for ${room.type} room`);
        return false;
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
        console.log('=== PLACING ITEMS ===');
        
        const scavengerBonus = META.getScavengerBonus(); // 0, 0.15, or 0.30
        const placeKeyBeforeRoom = (room) => {
            const roomIndex = this.rooms.indexOf(room);
            if (roomIndex <= 0) return;
            const priorRoom = this.rooms[roomIndex - 1];
            const kx = Phaser.Math.Between(priorRoom.x + 1, priorRoom.x + priorRoom.width - 2);
            const ky = Phaser.Math.Between(priorRoom.y + 1, priorRoom.y + priorRoom.height - 2);
            this.itemSpawns.push({ x: kx, y: ky, type: 'key', room: priorRoom });
        };
        
        let weaponStats = {
            handgun: 0,
            shotgun: 0,
            crossbow: 0,
            knife: 0,
            bat: 0,
            chainsaw: 0
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

                // Decide item type - REBALANCED for better weapon variety
                const roll = Math.random();
                let itemType;
                if (roll < 0.25) itemType = 'health';
                else if (roll < 0.32) itemType = 'ammo_pistol';
                else if (roll < 0.38) itemType = 'ammo_shotgun';
                else if (roll < 0.42) itemType = 'ammo_crossbow';
                else if (roll < 0.50) itemType = 'weapon_knife';
                else if (roll < 0.58) itemType = 'weapon_bat';
                else if (roll < 0.68) itemType = 'weapon_handgun'; // Increased from 5% to 10%
                else if (roll < 0.76) itemType = 'weapon_shotgun'; // Increased from 3% to 8%
                else if (roll < 0.82) itemType = 'weapon_crossbow'; // Increased from 2% to 6%
                else if (roll < 0.86) itemType = 'weapon_chainsaw';
                else if (roll < 0.89) itemType = 'grenade';
                else if (roll < 0.92) itemType = 'key';
                else if (roll < 0.95) itemType = 'repair_kit';
                else if (roll < 0.98) {
                    // Random passive item
                    const passiveKeys = Object.keys(CONFIG.PASSIVE_ITEMS);
                    itemType = 'passive_' + passiveKeys[Math.floor(Math.random() * passiveKeys.length)];
                }
                else itemType = 'weapon_handgun'; // Extra chance for pistols

                // Track weapon spawns for debugging
                if (itemType.includes('weapon_')) {
                    const weaponType = itemType.replace('weapon_', '');
                    if (weaponStats[weaponType]) weaponStats[weaponType]++;
                }

                this.itemSpawns.push({ x: ix, y: iy, type: itemType, room: room });
            }

            // Locked rooms always have a key somewhere in a prior room
            if (room.type === 'locked') {
                placeKeyBeforeRoom(room);
            }

            // Boss/escape room requires a key: place it in the previous room
            if (room.type === 'boss') {
                placeKeyBeforeRoom(room);
            }
        }
        
        // Log weapon generation statistics
        console.log('WEAPON GENERATION STATS:');
        console.log('- Pistol/Handgun:', weaponStats.handgun);
        console.log('- Shotgun:', weaponStats.shotgun);
        console.log('- Crossbow:', weaponStats.crossbow);
        console.log('- Knife:', weaponStats.knife);
        console.log('- Baseball Bat:', weaponStats.bat);
        console.log('- Chainsaw:', weaponStats.chainsaw);
        console.log(`Total items spawned: ${this.itemSpawns.length}`);
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

    _placeFurniture() {
        this.furniture = [];
        
        for (const room of this.rooms) {
            // Skip very small rooms or corridors
            if (room.width < 4 || room.height < 4) continue;
            
            // Determine room layout based on type and size
            const furnitureType = this._getRoomFurnitureType(room);
            this._placeFurnitureInRoom(room, furnitureType);
        }
    }

    _getRoomFurnitureType(room) {
        // Determine what type of office space this should be
        const roomSize = room.width * room.height;
        const isSmall = roomSize < 40;
        const isMedium = roomSize >= 40 && roomSize < 80; 
        const isLarge = roomSize >= 80;

        if (room.type === 'start') return 'reception';
        if (room.type === 'boss') return 'executive_office';
        
        // Random assignment based on size
        const rand = Phaser.Math.Between(0, 100);
        
        if (isSmall) {
            if (rand < 30) return 'storage_room';
            if (rand < 60) return 'small_office';
            if (rand < 80) return 'break_room';
            return 'copy_room';
        } else if (isMedium) {
            if (rand < 30) return 'cubicle_office';
            if (rand < 60) return 'meeting_room';
            if (rand < 80) return 'general_office';
            return 'archive_room';
        } else { // isLarge
            if (rand < 40) return 'conference_room';
            if (rand < 70) return 'open_office';
            return 'executive_office';
        }
    }

    _placeFurnitureInRoom(room, furnitureType) {
        const furniture = [];
        
        // Get available floor positions (avoid borders)
        const availablePositions = [];
        for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
            for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
                const tile = this.getTile(x, y);
                if (tile && tile.type === 'floor') {
                    availablePositions.push({ x, y });
                }
            }
        }

        // Place furniture based on room type
        switch (furnitureType) {
            case 'reception':
                this._placeReceptionFurniture(room, availablePositions);
                break;
            case 'executive_office':
                this._placeExecutiveFurniture(room, availablePositions);
                break;
            case 'cubicle_office':
                this._placeCubicleFurniture(room, availablePositions);
                break;
            case 'meeting_room':
            case 'conference_room':
                this._placeMeetingFurniture(room, availablePositions);
                break;
            case 'break_room':
                this._placeBreakRoomFurniture(room, availablePositions);
                break;
            case 'copy_room':
                this._placeCopyRoomFurniture(room, availablePositions);
                break;
            case 'storage_room':
                this._placeStorageFurniture(room, availablePositions);
                break;
            case 'archive_room':
                this._placeArchiveFurniture(room, availablePositions);
                break;
            default:
                this._placeGeneralOfficeFurniture(room, availablePositions);
                break;
        }
    }

    _placeReceptionFurniture(room, positions) {
        if (positions.length < 3) return;
        
        // Reception desk
        const deskPos = this._findCornerPosition(room, positions);
        if (deskPos) {
            this.furniture.push({ x: deskPos.x, y: deskPos.y, type: 'computer_desk' });
            this._removePosition(positions, deskPos.x, deskPos.y);
        }
        
        // Chairs for waiting
        const chairPositions = this._selectRandomPositions(positions, 2);
        chairPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'chair' });
        });
        
        // Decorative plant
        const plantPos = positions[0];
        if (plantPos) {
            this.furniture.push({ x: plantPos.x, y: plantPos.y, type: 'potted_plant' });
        }
    }

    _placeExecutiveFurniture(room, positions) {
        if (positions.length < 4) return;
        
        // Large desk
        const deskPos = this._findCornerPosition(room, positions);
        if (deskPos) {
            this.furniture.push({ x: deskPos.x, y: deskPos.y, type: 'computer_desk' });
            this._removePosition(positions, deskPos.x, deskPos.y);
        }
        
        // Executive chair
        const chairPos = this._selectRandomPositions(positions, 1)[0];
        if (chairPos) {
            this.furniture.push({ x: chairPos.x, y: chairPos.y, type: 'chair' });
        }
        
        // Bookshelf
        const bookshelfPos = this._selectRandomPositions(positions, 1)[0];
        if (bookshelfPos) {
            this.furniture.push({ x: bookshelfPos.x, y: bookshelfPos.y, type: 'bookshelf' });
        }
        
        // Filing cabinet
        const cabinetPos = this._selectRandomPositions(positions, 1)[0];
        if (cabinetPos) {
            this.furniture.push({ x: cabinetPos.x, y: cabinetPos.y, type: 'filing_cabinet' });
        }
        
        // Safe (for important documents)
        const safePos = this._selectRandomPositions(positions, 1)[0];
        if (safePos && Phaser.Math.Between(0, 100) < 70) {
            this.furniture.push({ x: safePos.x, y: safePos.y, type: 'safe' });
        }
        
        // Presidential poster
        const posterPos = this._selectRandomPositions(positions, 1)[0];
        if (posterPos) {
            this.furniture.push({ x: posterPos.x, y: posterPos.y, type: 'poster_president' });
        }
        
        // Office phone
        const phonePos = this._selectRandomPositions(positions, 1)[0];
        if (phonePos) {
            this.furniture.push({ x: phonePos.x, y: phonePos.y, type: 'office_phone' });
        }
    }

    _placeCubicleFurniture(room, positions) {
        // Multiple small desk areas
        const numDesks = Math.min(Math.floor(positions.length / 3), 3);
        for (let i = 0; i < numDesks; i++) {
            const deskPos = this._selectRandomPositions(positions, 1)[0];
            if (!deskPos) break;
            
            this.furniture.push({ x: deskPos.x, y: deskPos.y, type: 'computer_desk' });
            this._removePosition(positions, deskPos.x, deskPos.y);
            
            // Chair nearby
            const chairPos = this._selectRandomPositions(positions, 1)[0];
            if (chairPos) {
                this.furniture.push({ x: chairPos.x, y: chairPos.y, type: 'chair' });
            }
        }
        
        // Shared filing cabinet
        const cabinetPos = this._selectRandomPositions(positions, 1)[0];
        if (cabinetPos) {
            this.furniture.push({ x: cabinetPos.x, y: cabinetPos.y, type: 'filing_cabinet' });
        }
    }

    _placeMeetingFurniture(room, positions) {
        // Conference table in center
        const centerPos = this._findCenterPosition(room, positions);
        if (centerPos) {
            this.furniture.push({ x: centerPos.x, y: centerPos.y, type: 'conference_table' });
            this._removePosition(positions, centerPos.x, centerPos.y);
        }
        
        // Chairs around table
        const numChairs = Math.min(4, positions.length);
        const chairPositions = this._selectRandomPositions(positions, numChairs);
        chairPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'chair' });
        });
        
        // Whiteboard
        const whiteboardPos = this._selectRandomPositions(positions, 1)[0];
        if (whiteboardPos) {
            this.furniture.push({ x: whiteboardPos.x, y: whiteboardPos.y, type: 'whiteboard' });
        }
    }

    _placeBreakRoomFurniture(room, positions) {
        // Coffee machine
        const coffeePos = this._selectRandomPositions(positions, 1)[0];
        if (coffeePos) {
            this.furniture.push({ x: coffeePos.x, y: coffeePos.y, type: 'coffee_machine' });
        }
        
        // Water cooler
        const waterPos = this._selectRandomPositions(positions, 1)[0];
        if (waterPos) {
            this.furniture.push({ x: waterPos.x, y: waterPos.y, type: 'water_cooler' });
        }
        
        // Vending machine
        const vendingPos = this._selectRandomPositions(positions, 1)[0];
        if (vendingPos && Phaser.Math.Between(0, 100) < 60) {
            this.furniture.push({ x: vendingPos.x, y: vendingPos.y, type: 'vending_machine' });
        }
        
        // Table and chairs
        const tablePos = this._selectRandomPositions(positions, 1)[0];
        if (tablePos) {
            this.furniture.push({ x: tablePos.x, y: tablePos.y, type: 'desk' });
        }
        
        const chairPositions = this._selectRandomPositions(positions, 2);
        chairPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'chair' });
        });
        
        // Trash bin
        const trashPos = this._selectRandomPositions(positions, 1)[0];
        if (trashPos) {
            this.furniture.push({ x: trashPos.x, y: trashPos.y, type: 'trash_bin' });
        }
    }

    _placeCopyRoomFurniture(room, positions) {
        // Copy machine
        const copyPos = this._selectRandomPositions(positions, 1)[0];
        if (copyPos) {
            this.furniture.push({ x: copyPos.x, y: copyPos.y, type: 'copy_machine' });
        }
        
        // Paper storage and mess
        const storagePositions = this._selectRandomPositions(positions, 2);
        storagePositions.forEach(pos => {
            const rand = Phaser.Math.Between(0, 100);
            if (rand < 60) {
                this.furniture.push({ x: pos.x, y: pos.y, type: 'photocopier_papers' });
            } else {
                this.furniture.push({ x: pos.x, y: pos.y, type: 'papers_scattered' });
            }
        });
        
        // Broken computer (office equipment failures)
        if (Phaser.Math.Between(0, 100) < 40) {
            const brokenPos = this._selectRandomPositions(positions, 1)[0];
            if (brokenPos) {
                this.furniture.push({ x: brokenPos.x, y: brokenPos.y, type: 'broken_computer' });
            }
        }
    }

    _placeStorageFurniture(room, positions) {
        // Multiple filing cabinets
        const numCabinets = Math.min(3, Math.floor(positions.length / 2));
        const cabinetPositions = this._selectRandomPositions(positions, numCabinets);
        cabinetPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'filing_cabinet' });
        });
        
        // Scattered papers
        const paperPositions = this._selectRandomPositions(positions, 2);
        paperPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'papers_scattered' });
        });
    }

    _placeArchiveFurniture(room, positions) {
        // Bookshelves along walls
        const numShelves = Math.min(4, Math.floor(positions.length / 3));
        const shelfPositions = this._selectRandomPositions(positions, numShelves);
        shelfPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'bookshelf' });
        });
        
        // Filing cabinets
        const cabinetPositions = this._selectRandomPositions(positions, 2);
        cabinetPositions.forEach(pos => {
            this.furniture.push({ x: pos.x, y: pos.y, type: 'filing_cabinet' });
        });
    }

    _placeGeneralOfficeFurniture(room, positions) {
        // Basic desk and chair
        const deskPos = this._selectRandomPositions(positions, 1)[0];
        if (deskPos) {
            this.furniture.push({ x: deskPos.x, y: deskPos.y, type: 'desk' });
            this._removePosition(positions, deskPos.x, deskPos.y);
        }
        
        const chairPos = this._selectRandomPositions(positions, 1)[0];
        if (chairPos) {
            this.furniture.push({ x: chairPos.x, y: chairPos.y, type: 'chair' });
        }
        
        // Desk lamp
        const lampPos = this._selectRandomPositions(positions, 1)[0];
        if (lampPos && Phaser.Math.Between(0, 100) < 50) {
            this.furniture.push({ x: lampPos.x, y: lampPos.y, type: 'lamp' });
        }
        
        // Random decorative element
        const rand = Phaser.Math.Between(0, 5);
        const decorPos = this._selectRandomPositions(positions, 1)[0];
        if (decorPos) {
            const decorTypes = ['potted_plant', 'trash_bin', 'papers_scattered', 'poster_president', 'office_phone', 'broken_computer'];
            this.furniture.push({ x: decorPos.x, y: decorPos.y, type: decorTypes[rand] });
        }
    }

    // Helper methods
    _findCornerPosition(room, positions) {
        // Find a position near a corner
        for (const pos of positions) {
            const distToCorner = Math.min(
                Math.abs(pos.x - room.x),
                Math.abs(pos.x - (room.x + room.width - 1)),
                Math.abs(pos.y - room.y),
                Math.abs(pos.y - (room.y + room.height - 1))
            );
            if (distToCorner <= 2) return pos;
        }
        return positions[0]; // fallback
    }

    _findCenterPosition(room, positions) {
        const centerX = Math.floor(room.x + room.width / 2);
        const centerY = Math.floor(room.y + room.height / 2);
        
        // Find closest position to center
        let closest = positions[0];
        let minDist = Infinity;
        
        for (const pos of positions) {
            const dist = Math.abs(pos.x - centerX) + Math.abs(pos.y - centerY);
            if (dist < minDist) {
                minDist = dist;
                closest = pos;
            }
        }
        return closest;
    }

    _selectRandomPositions(positions, count) {
        const shuffled = [...positions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    _removePosition(positions, x, y) {
        const index = positions.findIndex(pos => pos.x === x && pos.y === y);
        if (index !== -1) positions.splice(index, 1);
    }

    _placeSafetyEquipment() {
        // Place fire extinguishers and safety equipment in corridors and some rooms
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                const tile = this.getTile(x, y);
                if (!tile || tile.type !== 'floor') continue;
                
                // Check if this is a corridor position near a wall
                const isNearWall = this._isNearWall(x, y);
                const isCorridor = tile.corridor;
                const hasSpace = !this._hasFurnitureAt(x, y);
                
                if (hasSpace && isNearWall && isCorridor && Phaser.Math.Between(0, 100) < 8) {
                    this.furniture.push({ x: x, y: y, type: 'fire_extinguisher' });
                }
            }
        }
    }

    _isNearWall(x, y) {
        // Check if position is adjacent to a wall
        const neighbors = [
            {x: x-1, y: y}, {x: x+1, y: y}, {x: x, y: y-1}, {x: x, y: y+1}
        ];
        
        for (const neighbor of neighbors) {
            const tile = this.getTile(neighbor.x, neighbor.y);
            if (tile && tile.type === 'wall') return true;
        }
        return false;
    }

    _hasFurnitureAt(x, y) {
        return this.furniture.some(f => f.x === x && f.y === y);
    }
}

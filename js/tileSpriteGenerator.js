// ============================================
// President Devil — Runtime Tile Sprite Generator
// ============================================
// Generates 16×16 pixel-art textures for dungeon tiles.
// Each tile type gets its own texture key: 'tile_{type}'
//
// Tile types:
//   Walls:  tile_wall, tile_wall_ritual
//   Floors: tile_floor_office, tile_floor_corridor, tile_floor_boss
//   Doors:  tile_door, tile_door_locked, tile_door_sealed, tile_door_shortcut

const TILE_SPRITE_GEN = {

    FW: 16,
    FH: 16,

    generate(scene) {
        if (CONFIG.DEBUG) {
            console.log('[TileSpriteGen] Generating tile textures...');
        }

        const tiles = {
            // Walls
            tile_wall:           this._drawWall.bind(this),
            tile_wall_ritual:    this._drawWallRitual.bind(this),
            // Decorative Office Walls (non-interactive office rooms)
            tile_wall_office_desk:    this._drawOfficeWallDesk.bind(this),
            tile_wall_office_meeting: this._drawOfficeWallMeeting.bind(this),
            tile_wall_office_cubicle: this._drawOfficeWallCubicle.bind(this),
            tile_wall_office_storage: this._drawOfficeWallStorage.bind(this),
            tile_wall_office_window:  this._drawOfficeWallWindow.bind(this),
            tile_wall_office_break:   this._drawOfficeWallBreak.bind(this),
            tile_wall_office_server:  this._drawOfficeWallServer.bind(this),
            tile_wall_office_copy:    this._drawOfficeWallCopy.bind(this),
            // Floors
            tile_floor_office:   this._drawFloorOffice.bind(this),
            tile_floor_corridor: this._drawFloorCorridor.bind(this),
            tile_floor_boss:     this._drawFloorBoss.bind(this),
            // Doors
            tile_door:           this._drawDoor.bind(this),
            tile_door_locked:    this._drawDoorLocked.bind(this),
            tile_door_sealed:    this._drawDoorSealed.bind(this),
            tile_door_shortcut:  this._drawDoorShortcut.bind(this),
            // Office Furniture
            tile_desk:           this._drawDesk.bind(this),
            tile_chair:          this._drawChair.bind(this),
            tile_filing_cabinet: this._drawFilingCabinet.bind(this),
            tile_bookshelf:      this._drawBookshelf.bind(this),
            tile_conference_table: this._drawConferenceTable.bind(this),
            tile_water_cooler:   this._drawWaterCooler.bind(this),
            tile_copy_machine:   this._drawCopyMachine.bind(this),
            tile_computer_desk:  this._drawComputerDesk.bind(this),
            // Decorative Elements
            tile_potted_plant:   this._drawPottedPlant.bind(this),
            tile_poster_president: this._drawPresidentPoster.bind(this),
            tile_papers_scattered: this._drawScatteredPapers.bind(this),
            tile_coffee_machine: this._drawCoffeeMachine.bind(this),
            tile_trash_bin:      this._drawTrashBin.bind(this),
            // Additional Office Elements  
            tile_whiteboard:     this._drawWhiteboard.bind(this),
            tile_office_phone:   this._drawOfficePhone.bind(this),
            tile_lamp:           this._drawDeskLamp.bind(this),
            tile_safe:           this._drawSafe.bind(this),
            tile_vending_machine: this._drawVendingMachine.bind(this),
            tile_fire_extinguisher: this._drawFireExtinguisher.bind(this),
            tile_photocopier_papers: this._drawPhotocopierPapers.bind(this),
            tile_broken_computer: this._drawBrokenComputer.bind(this),
        };

        for (const [texKey, drawFn] of Object.entries(tiles)) {
            const canvas = document.createElement('canvas');
            canvas.width = this.FW;
            canvas.height = this.FH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            drawFn(ctx);

            if (scene.textures.exists(texKey)) {
                scene.textures.remove(texKey);
            }
            scene.textures.addCanvas(texKey, canvas);
            if (CONFIG.DEBUG) {
                console.log(`[TileSpriteGen] ${texKey} created`);
            }
        }

        if (CONFIG.DEBUG) {
            console.log('[TileSpriteGen] All tile textures generated.');
        }
    },

    // ── Helpers ──
    _px(ctx, x, y, c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    },
    _rect(ctx, x, y, w, h, c) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
    },

    /**
     * Returns the texture key for a given tile and position context.
     * @param {object} tile - The tile object { type, room, corridor, door }
     * @param {function} getAdjacentRoom - Function(x,y) that returns adjacent room or null
     * @param {number} x - Tile grid x
     * @param {number} y - Tile grid y
     */
    getTextureKey(tile, getAdjacentRoom, x, y) {
        if (tile.type === 'wall') {
            const room = getAdjacentRoom ? getAdjacentRoom(x, y) : null;
            if (room && room.type === 'boss') return 'tile_wall_ritual';
            
            // Generate varied office wall textures based on position
            const seed = (x * 73 + y * 37) % 100; // Simple pseudo-random based on position
            if (seed < 15) return 'tile_wall_office_desk';
            if (seed < 30) return 'tile_wall_office_meeting';
            if (seed < 45) return 'tile_wall_office_cubicle';
            if (seed < 55) return 'tile_wall_office_storage';
            if (seed < 65) return 'tile_wall_office_window';
            if (seed < 75) return 'tile_wall_office_break';
            if (seed < 85) return 'tile_wall_office_server';
            if (seed < 95) return 'tile_wall_office_copy';
            return 'tile_wall'; // fallback to regular wall
        }
        if (tile.type === 'floor') {
            if (tile.room && tile.room.type === 'boss') return 'tile_floor_boss';
            if (tile.corridor) return 'tile_floor_corridor';
            return 'tile_floor_office';
        }
        return 'tile_wall';
    },

    getDoorTextureKey(doorType) {
        if (doorType === 'locked') return 'tile_door_locked';
        if (doorType === 'shortcut') return 'tile_door_shortcut';
        if (doorType === 'sealed') return 'tile_door_sealed';
        return 'tile_door';
    },

    // ═══════════════════════════════════════════
    // WALLS
    // ═══════════════════════════════════════════

    _drawWall(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Base stone fill
        r(0, 0, 16, 16, '#8888aa');

        // Brick pattern — row 1 (top)
        // Mortar horizontal line
        r(0, 0, 16, 1, '#666680');
        // Bricks row 1: offset 0
        r(0, 1, 7, 3, '#9999bb');
        r(8, 1, 8, 3, '#8888aa');
        px(7, 1, '#666680'); px(7, 2, '#666680'); px(7, 3, '#666680');

        // Mortar horizontal line
        r(0, 4, 16, 1, '#666680');
        // Bricks row 2: offset by 4 tiles
        r(0, 5, 3, 3, '#8888aa');
        r(4, 5, 7, 3, '#9494b4');
        r(12, 5, 4, 3, '#8c8cac');
        px(3, 5, '#666680'); px(3, 6, '#666680'); px(3, 7, '#666680');
        px(11, 5, '#666680'); px(11, 6, '#666680'); px(11, 7, '#666680');

        // Mortar horizontal line
        r(0, 8, 16, 1, '#666680');
        // Bricks row 3: offset 0
        r(0, 9, 7, 3, '#8c8cac');
        r(8, 9, 8, 3, '#9090b0');
        px(7, 9, '#666680'); px(7, 10, '#666680'); px(7, 11, '#666680');

        // Mortar horizontal line
        r(0, 12, 16, 1, '#666680');
        // Bricks row 4: offset
        r(0, 13, 3, 3, '#9090b0');
        r(4, 13, 7, 3, '#8888aa');
        r(12, 13, 4, 3, '#9494b4');
        px(3, 13, '#666680'); px(3, 14, '#666680'); px(3, 15, '#666680');
        px(11, 13, '#666680'); px(11, 14, '#666680'); px(11, 15, '#666680');

        // Subtle highlights on top edge of some bricks
        px(1, 1, '#a0a0c0'); px(2, 1, '#a0a0c0');
        px(9, 1, '#9a9abc'); px(10, 1, '#9a9abc');
        px(5, 5, '#a0a0c0'); px(6, 5, '#a0a0c0');
        px(1, 9, '#9a9abc'); px(2, 9, '#9a9abc');
        px(5, 13, '#a0a0c0');

        // Subtle shadow on bottom edge of some bricks
        px(4, 3, '#7878a0'); px(5, 3, '#7878a0');
        px(12, 7, '#7878a0'); px(13, 7, '#7878a0');
        px(3, 11, '#7878a0'); px(4, 11, '#7878a0');
        px(8, 15, '#7878a0'); px(9, 15, '#7878a0');
    },

    _drawWallRitual(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Base dark crimson fill
        r(0, 0, 16, 16, '#6a2020');

        // Brick pattern — same layout but red tones
        r(0, 0, 16, 1, '#4a1515');
        r(0, 1, 7, 3, '#8a2828');
        r(8, 1, 8, 3, '#7a2222');
        px(7, 1, '#4a1515'); px(7, 2, '#4a1515'); px(7, 3, '#4a1515');

        r(0, 4, 16, 1, '#4a1515');
        r(0, 5, 3, 3, '#7a2222');
        r(4, 5, 7, 3, '#882828');
        r(12, 5, 4, 3, '#802525');
        px(3, 5, '#4a1515'); px(3, 6, '#4a1515'); px(3, 7, '#4a1515');
        px(11, 5, '#4a1515'); px(11, 6, '#4a1515'); px(11, 7, '#4a1515');

        r(0, 8, 16, 1, '#4a1515');
        r(0, 9, 7, 3, '#802525');
        r(8, 9, 8, 3, '#852727');
        px(7, 9, '#4a1515'); px(7, 10, '#4a1515'); px(7, 11, '#4a1515');

        r(0, 12, 16, 1, '#4a1515');
        r(0, 13, 3, 3, '#852727');
        r(4, 13, 7, 3, '#7a2222');
        r(12, 13, 4, 3, '#882828');
        px(3, 13, '#4a1515'); px(3, 14, '#4a1515'); px(3, 15, '#4a1515');
        px(11, 13, '#4a1515'); px(11, 14, '#4a1515'); px(11, 15, '#4a1515');

        // Glowing rune accents (orange-red glowing cracks in mortar)
        px(2, 0, '#cc4422'); px(10, 0, '#cc4422');
        px(6, 4, '#cc4422'); px(14, 4, '#cc4422');
        px(1, 8, '#cc4422'); px(9, 8, '#cc4422');
        px(5, 12, '#cc4422'); px(13, 12, '#cc4422');

        // Small glowing rune symbol on center brick
        px(5, 6, '#dd5533'); px(6, 6, '#ee6644');
        px(5, 7, '#ee6644'); px(6, 7, '#dd5533');

        // Highlights
        px(1, 1, '#9a3030'); px(9, 1, '#9a3030');
        px(5, 5, '#9a3030');
    },

    // ═══════════════════════════════════════════
    // DECORATIVE OFFICE WALLS (TOP-DOWN OFFICE ROOMS)
    // ═══════════════════════════════════════════

    _drawOfficeWallDesk(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Room floor background
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Room walls/border (darker)
        r(0, 0, 16, 1, '#4A4A6A'); // top
        r(0, 15, 16, 1, '#4A4A6A'); // bottom
        r(0, 0, 1, 16, '#4A4A6A'); // left
        r(15, 0, 1, 16, '#4A4A6A'); // right
        
        // Desk (brown)
        r(3, 8, 6, 4, '#8B4513');
        r(4, 9, 4, 2, '#A0522D');
        
        // Chair
        r(6, 12, 3, 2, '#2F2F2F');
        r(7, 13, 1, 1, '#404040');
        
        // Computer monitor
        r(5, 6, 3, 2, '#1C1C1C');
        r(6, 7, 1, 1, '#000080'); // blue screen
        
        // Papers on desk
        r(4, 10, 2, 1, '#FFFFFF');
        px(8, 9, '#C0C0C0'); // stapler
        
        // Window
        r(1, 2, 2, 4, '#87CEEB');
        px(1, 4, '#FFFFFF'); px(2, 4, '#FFFFFF'); // window frames
    },

    _drawOfficeWallMeeting(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Room floor 
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Walls
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Conference table (oval-ish)
        r(4, 6, 8, 4, '#8B4513');
        r(5, 5, 6, 6, '#A0522D');
        
        // Chairs around table
        r(3, 7, 2, 2, '#2F2F2F'); // left chair
        r(11, 7, 2, 2, '#2F2F2F'); // right chair
        r(6, 4, 2, 1, '#2F2F2F'); // top chair
        r(6, 11, 2, 1, '#2F2F2F'); // bottom chair
        
        // Whiteboard
        r(1, 1, 6, 3, '#F5F5F5');
        px(2, 2, '#0000FF'); px(3, 2, '#0000FF'); // writing
        px(2, 3, '#FF0000'); // bullet point
        
        // Projector screen
        r(10, 1, 5, 3, '#E0E0E0');
        px(11, 2, '#000000'); // text
    },

    _drawOfficeWallCubicle(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Floor
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Outer walls
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Cubicle dividers (creating 4 small cubicles)
        r(8, 1, 1, 14, '#808080'); // vertical divider
        r(1, 8, 14, 1, '#808080'); // horizontal divider
        
        // Desks in each cubicle
        r(2, 3, 4, 2, '#8B4513'); // top-left desk
        r(10, 3, 4, 2, '#8B4513'); // top-right desk
        r(2, 10, 4, 2, '#8B4513'); // bottom-left desk
        r(10, 10, 4, 2, '#8B4513'); // bottom-right desk
        
        // Computers
        r(3, 2, 2, 1, '#1C1C1C');
        r(11, 2, 2, 1, '#1C1C1C');
        r(3, 9, 2, 1, '#1C1C1C');
        r(11, 9, 2, 1, '#1C1C1C');
        
        // Chairs
        r(4, 6, 1, 1, '#2F2F2F');
        r(12, 6, 1, 1, '#2F2F2F');
        r(4, 13, 1, 1, '#2F2F2F');
        r(12, 13, 1, 1, '#2F2F2F');
    },

    _drawOfficeWallStorage(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Floor
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Walls
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Filing cabinets along walls
        r(1, 2, 3, 6, '#708090'); // left wall cabinets
        r(1, 9, 3, 6, '#708090');
        r(12, 2, 3, 6, '#708090'); // right wall cabinets
        r(12, 9, 3, 6, '#708090');
        
        // Boxes/storage containers
        r(5, 3, 3, 3, '#8B4513'); // cardboard boxes
        r(8, 3, 3, 3, '#654321');
        r(6, 7, 3, 3, '#8B4513');
        r(5, 11, 4, 3, '#654321');
        
        // Shelving unit
        r(6, 1, 4, 1, '#808080'); // shelf
        px(7, 2, '#FFFFFF'); px(8, 2, '#FFFFFF'); // items on shelf
        
        // Ladder
        px(11, 4, '#C0C0C0'); px(11, 6, '#C0C0C0');
        px(11, 5, '#C0C0C0'); // ladder rungs
    },

    _drawOfficeWallWindow(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Floor
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Walls (with large window)
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Large window (top wall)
        r(3, 0, 10, 4, '#87CEEB'); // sky blue window
        r(3, 0, 10, 1, '#5F9EA0'); // window frame top
        r(3, 3, 10, 1, '#5F9EA0'); // window frame bottom
        r(3, 0, 1, 4, '#5F9EA0'); // left frame
        r(12, 0, 1, 4, '#5F9EA0'); // right frame
        r(7, 0, 2, 4, '#5F9EA0'); // center divider
        
        // Window blinds (partially closed)
        px(4, 1, '#F5F5F5'); px(6, 1, '#F5F5F5'); px(9, 1, '#F5F5F5');
        px(4, 2, '#E0E0E0'); px(6, 2, '#E0E0E0'); px(9, 2, '#E0E0E0');
        
        // Simple furniture for the office
        r(2, 8, 5, 3, '#8B4513'); // desk
        r(8, 6, 2, 2, '#2F2F2F'); // chair
        
        // Plant by window
        r(13, 5, 2, 3, '#8B4513'); // pot
        px(14, 4, '#228B22'); px(14, 3, '#32CD32'); // plant leaves
        
        // Sunlight effect
        px(5, 6, '#FFFACD'); px(8, 8, '#FFFACD'); // sunbeam spots
    },

    _drawOfficeWallBreak(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Floor
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Walls
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Coffee machine
        r(1, 2, 3, 4, '#2F2F2F');
        r(2, 3, 1, 2, '#8B4513'); // coffee pot
        px(2, 1, '#FF4500'); // power light
        
        // Vending machine
        r(12, 1, 3, 6, '#FF4500');
        px(13, 3, '#FFD700'); px(14, 3, '#32CD32'); // snacks
        px(13, 4, '#FF0000'); px(14, 4, '#9370DB');
        
        // Table and chairs
        r(5, 8, 6, 3, '#8B4513'); // round table
        r(3, 11, 2, 2, '#2F2F2F'); // chair 1
        r(11, 11, 2, 2, '#2F2F2F'); // chair 2
        r(6, 6, 2, 1, '#2F2F2F'); // chair 3
        
        // Refrigerator
        r(1, 8, 2, 6, '#E0E0E0');
        px(1, 10, '#C0C0C0'); // handle
        px(2, 9, '#00FF00'); // power light
        
        // Microwave on counter
        r(9, 3, 3, 2, '#1C1C1C');
        px(10, 4, '#FFFFFF'); // display
        
        // Sink
        r(5, 1, 4, 3, '#C0C0C0');
        px(7, 2, '#4682B4'); // water
    },

    _drawOfficeWallServer(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Floor (darker, tech room)
        r(0, 0, 16, 16, '#5A5A7A');
        
        // Walls
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Server racks
        r(1, 1, 3, 14, '#1C1C1C'); // left rack
        r(5, 1, 3, 14, '#1C1C1C'); // center rack
        r(9, 1, 3, 14, '#1C1C1C'); // right rack
        
        // LED lights on servers (blinking indicators)
        px(2, 3, '#00FF00'); px(3, 3, '#FF0000'); px(2, 5, '#0000FF');
        px(6, 4, '#FFFF00'); px(7, 4, '#00FF00'); px(6, 6, '#FF0000');
        px(10, 2, '#00FF00'); px(11, 2, '#00FF00'); px(10, 8, '#FF0000');
        px(2, 8, '#0000FF'); px(3, 10, '#FFFF00'); px(2, 12, '#00FF00');
        px(6, 9, '#FF0000'); px(7, 11, '#00FF00'); px(6, 13, '#0000FF');
        px(10, 5, '#FFFF00'); px(11, 7, '#FF0000'); px(10, 11, '#00FF00');
        
        // Cooling vents
        px(2, 1, '#666666'); px(3, 1, '#666666');
        px(6, 1, '#666666'); px(7, 1, '#666666');
        px(10, 1, '#666666'); px(11, 1, '#666666');
        
        // Cable management
        px(4, 3, '#000000'); px(4, 7, '#000000'); px(4, 11, '#000000');
        px(8, 4, '#000000'); px(8, 8, '#000000'); px(8, 12, '#000000');
        
        // Workstation
        r(13, 8, 2, 3, '#8B4513'); // small desk
        r(13, 6, 2, 2, '#1C1C1C'); // monitor
        px(14, 7, '#00FF00'); // screen glow
        r(14, 11, 1, 1, '#2F2F2F'); // chair
    },

    _drawOfficeWallCopy(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Floor
        r(0, 0, 16, 16, '#6B6B8D');
        
        // Walls
        r(0, 0, 16, 1, '#4A4A6A');
        r(0, 15, 16, 1, '#4A4A6A');
        r(0, 0, 1, 16, '#4A4A6A');
        r(15, 0, 1, 16, '#4A4A6A');
        
        // Copy machine (large)
        r(2, 2, 6, 8, '#F5F5F5');
        r(3, 3, 4, 6, '#E0E0E0');
        px(6, 4, '#00FF00'); // power light
        px(7, 4, '#FF0000'); // error light
        px(5, 5, '#0000FF'); // display
        
        // Scanner lid (open)
        r(3, 1, 4, 2, '#D3D3D3');
        
        // Paper trays
        r(1, 6, 2, 3, '#FFFFFF'); // input tray
        r(8, 8, 2, 3, '#FFFFFF'); // output tray
        
        // Paper mess (jammed/scattered)
        r(9, 11, 3, 2, '#F0F0F0'); // paper stack on floor
        px(10, 12, '#E0E0E0'); // crumpled paper
        r(5, 11, 2, 3, '#FFFFFF'); // more papers
        px(6, 13, '#000000'); // ink stain
        
        // Supply shelving
        r(11, 1, 4, 4, '#808080'); // shelf
        px(12, 2, '#FFFFFF'); px(13, 2, '#FFFFFF'); // paper supplies
        px(12, 3, '#8B4513'); px(13, 3, '#654321'); // toner boxes
        
        // Tools and maintenance
        r(13, 6, 2, 2, '#654321'); // toolbox
        px(14, 7, '#C0C0C0'); // wrench
        
        // Trash bin (overflowing)
        r(1, 12, 2, 3, '#2F2F2F');
        px(2, 11, '#FFFFFF'); // overflowing paper
    },

    // ═══════════════════════════════════════════
    // FLOORS
    // ═══════════════════════════════════════════

    _drawFloorOffice(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Base office tile color
        r(0, 0, 16, 16, '#555578');

        // Tile grid pattern (8×8 tiles within the 16px tile — 2 sub-tiles)
        // Subtle grid lines
        r(0, 0, 16, 1, '#4a4a6a');  // top edge
        r(0, 0, 1, 16, '#4a4a6a');  // left edge
        r(0, 8, 16, 1, '#4a4a6a');  // mid horizontal
        r(8, 0, 1, 16, '#4a4a6a');  // mid vertical

        // Top-left sub-tile lighter
        r(1, 1, 7, 7, '#5c5c82');
        // Top-right sub-tile
        r(9, 1, 7, 7, '#585878');
        // Bottom-left sub-tile
        r(1, 9, 7, 7, '#585878');
        // Bottom-right sub-tile slightly different
        r(9, 9, 7, 7, '#5a5a7e');

        // Subtle texture dots (dust/wear marks)
        px(3, 3, '#505070');
        px(11, 5, '#505070');
        px(5, 11, '#626286');
        px(13, 13, '#505070');
        px(2, 10, '#626286');
        px(12, 2, '#626286');

        // Highlight reflections on some sub-tile corners
        px(1, 1, '#666690');
        px(9, 9, '#666690');
    },

    _drawFloorCorridor(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Base concrete
        r(0, 0, 16, 16, '#505060');

        // Concrete texture — patches of slightly different shades
        r(0, 0, 6, 5, '#525268');
        r(6, 0, 5, 4, '#4c4c5c');
        r(11, 0, 5, 6, '#4e4e60');
        r(0, 5, 4, 5, '#4e4e5e');
        r(4, 4, 6, 5, '#545468');
        r(10, 6, 6, 5, '#4c4c5c');
        r(0, 10, 5, 6, '#525264');
        r(5, 9, 6, 7, '#4e4e60');
        r(11, 11, 5, 5, '#525268');

        // Crack lines (dark)
        px(3, 2, '#3a3a4a'); px(4, 3, '#3a3a4a'); px(4, 4, '#3a3a4a');
        px(5, 5, '#3a3a4a'); px(5, 6, '#3a3a4a');
        px(10, 10, '#3a3a4a'); px(11, 11, '#3a3a4a'); px(12, 11, '#3a3a4a');
        px(13, 12, '#3a3a4a');

        // More crack details
        px(8, 1, '#3e3e50'); px(9, 2, '#3e3e50');
        px(2, 12, '#3e3e50'); px(3, 13, '#3e3e50'); px(3, 14, '#3e3e50');

        // Small pebble/debris highlights
        px(1, 7, '#5a5a6e');
        px(7, 3, '#5a5a6e');
        px(12, 8, '#5a5a6e');
        px(14, 3, '#585868');

        // Worn spots (slightly lighter patches)
        px(6, 7, '#585870'); px(7, 7, '#585870');
        px(9, 13, '#585870');
    },

    _drawFloorBoss(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Base dark red stone
        r(0, 0, 16, 16, '#3a1818');

        // Stone slab pattern
        r(0, 0, 16, 1, '#2a1010');
        r(0, 0, 1, 16, '#2a1010');
        r(0, 8, 16, 1, '#2a1010');
        r(8, 0, 1, 16, '#2a1010');

        // Sub-tile fills with variation
        r(1, 1, 7, 7, '#3e1c1c');
        r(9, 1, 7, 7, '#381616');
        r(1, 9, 7, 7, '#401e1e');
        r(9, 9, 7, 7, '#3c1a1a');

        // Ritual markings — pentagram-like scratches
        // Diagonal line top-left to bottom-right
        px(2, 2, '#661818'); px(3, 3, '#772222'); px(4, 4, '#661818');
        px(11, 2, '#661818'); px(12, 3, '#772222'); px(13, 4, '#661818');
        px(2, 11, '#661818'); px(3, 12, '#772222'); px(4, 13, '#661818');
        px(11, 11, '#661818'); px(12, 12, '#772222'); px(13, 13, '#661818');

        // Central glow point
        px(7, 7, '#993333'); px(8, 7, '#993333');
        px(7, 8, '#993333'); px(8, 8, '#993333');

        // Connecting lines
        px(5, 5, '#552222'); px(10, 5, '#552222');
        px(5, 10, '#552222'); px(10, 10, '#552222');
        px(7, 4, '#552222'); px(8, 4, '#552222');
        px(7, 11, '#552222'); px(8, 11, '#552222');
        px(4, 7, '#552222'); px(4, 8, '#552222');
        px(11, 7, '#552222'); px(11, 8, '#552222');

        // Blood stain
        px(3, 6, '#441111');
        px(12, 9, '#441111');
        px(6, 14, '#441111');
    },

    // ═══════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════

    _drawDoor(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Door frame (dark wood border)
        r(1, 0, 14, 16, '#553311');

        // Door panels (lighter wood)
        r(2, 1, 12, 14, '#886633');

        // Wood grain horizontal lines
        r(2, 3, 12, 1, '#775522');
        r(2, 7, 12, 1, '#775522');
        r(2, 11, 12, 1, '#775522');

        // Panel divisions
        r(2, 1, 5, 5, '#997744');
        r(9, 1, 5, 5, '#8a6633');
        r(2, 8, 5, 6, '#8a6633');
        r(9, 8, 5, 6, '#997744');

        // Panel borders
        r(7, 1, 2, 14, '#664422');
        r(2, 6, 12, 2, '#664422');

        // Door handle (brass)
        px(11, 8, '#ccaa44'); px(12, 8, '#ddbb55');
        px(11, 9, '#bbaa33'); px(12, 9, '#ccaa44');

        // Top/bottom frame
        r(1, 0, 14, 1, '#442211');
        r(1, 15, 14, 1, '#442211');

        // Side frame
        r(1, 0, 1, 16, '#442211');
        r(14, 0, 1, 16, '#442211');

        // Highlight
        px(3, 2, '#aa8855');
        px(10, 2, '#aa8855');
    },

    _drawDoorLocked(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Reinforced frame (dark iron)
        r(0, 0, 16, 16, '#333344');

        // Iron door body
        r(1, 1, 14, 14, '#555566');

        // Metal plate texture
        r(2, 2, 12, 12, '#606070');

        // Rivets (corner bolts)
        px(2, 2, '#888899'); px(13, 2, '#888899');
        px(2, 13, '#888899'); px(13, 13, '#888899');
        px(7, 2, '#888899'); px(8, 2, '#888899');
        px(7, 13, '#888899'); px(8, 13, '#888899');

        // Cross reinforcement bars
        r(2, 7, 12, 2, '#4a4a5a');
        r(7, 2, 2, 12, '#4a4a5a');

        // Keyhole
        px(7, 9, '#222222');
        px(8, 9, '#222222');
        px(7, 10, '#333333');
        px(8, 10, '#333333');
        px(8, 11, '#222222');

        // Lock plate (gold/brass)
        r(6, 8, 4, 5, '#bbaa33');
        r(7, 8, 2, 5, '#ddcc44');
        // Keyhole in lock
        px(7, 9, '#222233');
        px(8, 9, '#222233');
        px(7, 10, '#333344');
        px(8, 10, '#333344');
        px(8, 11, '#222233');

        // Frame edges
        r(0, 0, 16, 1, '#222233');
        r(0, 15, 16, 1, '#222233');
        r(0, 0, 1, 16, '#222233');
        r(15, 0, 1, 16, '#222233');
    },

    _drawDoorSealed(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Pulsing red magical barrier
        r(0, 0, 16, 16, '#880000');

        // Energy field gradient
        r(1, 1, 14, 14, '#aa1111');
        r(2, 2, 12, 12, '#cc2222');
        r(3, 3, 10, 10, '#dd3333');
        r(4, 4, 8, 8, '#cc2222');
        r(5, 5, 6, 6, '#aa1111');

        // X barrier pattern
        px(2, 2, '#ff4444'); px(3, 3, '#ff5555'); px(4, 4, '#ff4444');
        px(5, 5, '#ff5555'); px(6, 6, '#ff6666'); px(7, 7, '#ff7777');
        px(8, 8, '#ff7777'); px(9, 9, '#ff6666'); px(10, 10, '#ff5555');
        px(11, 11, '#ff4444'); px(12, 12, '#ff5555'); px(13, 13, '#ff4444');

        px(13, 2, '#ff4444'); px(12, 3, '#ff5555'); px(11, 4, '#ff4444');
        px(10, 5, '#ff5555'); px(9, 6, '#ff6666'); px(8, 7, '#ff7777');
        px(7, 8, '#ff7777'); px(6, 9, '#ff6666'); px(5, 10, '#ff5555');
        px(4, 11, '#ff4444'); px(3, 12, '#ff5555'); px(2, 13, '#ff4444');

        // Bright center
        px(7, 7, '#ffaaaa'); px(8, 7, '#ffaaaa');
        px(7, 8, '#ffaaaa'); px(8, 8, '#ffaaaa');

        // Dark frame
        r(0, 0, 16, 1, '#550000');
        r(0, 15, 16, 1, '#550000');
        r(0, 0, 1, 16, '#550000');
        r(15, 0, 1, 16, '#550000');
    },

    _drawDoorShortcut(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Frame (dark metal-blue)
        r(0, 0, 16, 16, '#223344');

        // Door body (blue-tinted metal)
        r(1, 1, 14, 14, '#446688');

        // Metal plate
        r(2, 2, 12, 12, '#5577aa');

        // One-way arrow symbol (pointing right/forward)
        // Arrow shaft
        r(4, 7, 6, 2, '#aaccee');
        // Arrow head
        px(10, 5, '#aaccee'); px(10, 6, '#bbddff');
        px(10, 7, '#ccddff'); px(10, 8, '#ccddff');
        px(10, 9, '#bbddff'); px(10, 10, '#aaccee');
        px(11, 6, '#bbddff'); px(11, 7, '#ccddff');
        px(11, 8, '#ccddff'); px(11, 9, '#bbddff');
        px(12, 7, '#ccddff'); px(12, 8, '#ccddff');

        // Rivets
        px(2, 2, '#7799bb'); px(13, 2, '#7799bb');
        px(2, 13, '#7799bb'); px(13, 13, '#7799bb');

        // Frame edges
        r(0, 0, 16, 1, '#112233');
        r(0, 15, 16, 1, '#112233');
        r(0, 0, 1, 16, '#112233');
        r(15, 0, 1, 16, '#112233');
    },

    // ═══════════════════════════════════════════
    // OFFICE FURNITURE
    // ═══════════════════════════════════════════

    _drawDesk(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Desk surface (wood grain)
        r(1, 8, 14, 7, '#8B4513');
        r(2, 9, 12, 6, '#A0522D');
        
        // Wood grain lines
        px(3, 10, '#654321'); px(7, 10, '#654321'); px(11, 10, '#654321');
        px(4, 12, '#654321'); px(9, 12, '#654321'); px(13, 12, '#654321');
        
        // Desk legs
        r(2, 12, 2, 3, '#654321');
        r(12, 12, 2, 3, '#654321');
        
        // Papers on desk
        r(3, 9, 3, 2, '#FFFFFF');
        r(10, 9, 2, 3, '#F5F5F5');
        
        // Pen
        px(6, 11, '#1E90FF');
        px(7, 11, '#000080');
        
        // Coffee stain
        px(9, 10, '#8B4513');
        px(10, 10, '#A0522D');
    },

    _drawChair(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Chair back
        r(5, 2, 6, 8, '#2F2F2F');
        r(6, 3, 4, 6, '#404040');
        
        // Chair seat
        r(4, 8, 8, 4, '#2F2F2F');
        r(5, 9, 6, 2, '#404040');
        
        // Chair base (swivel)
        r(7, 12, 2, 2, '#555555');
        
        // Wheels
        px(5, 14, '#666666'); px(6, 14, '#666666');
        px(9, 14, '#666666'); px(10, 14, '#666666');
        
        // Armrests
        r(4, 6, 1, 3, '#333333');
        r(11, 6, 1, 3, '#333333');
    },

    _drawFilingCabinet(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Cabinet body
        r(3, 4, 10, 11, '#708090');
        r(4, 5, 8, 9, '#778899');
        
        // Drawer dividers
        r(4, 7, 8, 1, '#2F2F2F');
        r(4, 10, 8, 1, '#2F2F2F');
        r(4, 13, 8, 1, '#2F2F2F');
        
        // Drawer handles
        px(11, 6, '#C0C0C0'); px(11, 9, '#C0C0C0');
        px(11, 12, '#C0C0C0'); px(11, 15, '#C0C0C0');
        
        // Labels on drawers
        r(5, 6, 2, 1, '#FFFFFF'); r(5, 9, 2, 1, '#FFFFFF');
        r(5, 12, 2, 1, '#FFFFFF');
        
        // Lock
        px(10, 6, '#FFD700');
    },

    _drawBookshelf(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Shelf frame
        r(2, 2, 12, 13, '#8B4513');
        r(3, 3, 10, 11, '#A0522D');
        
        // Shelf dividers
        r(3, 6, 10, 1, '#654321');
        r(3, 10, 10, 1, '#654321');
        
        // Books on top shelf
        r(4, 4, 1, 2, '#800080'); r(5, 4, 1, 2, '#008000');
        r(6, 4, 1, 2, '#FF4500'); r(7, 4, 1, 2, '#4169E1');
        r(8, 4, 1, 2, '#DC143C'); r(9, 4, 1, 2, '#228B22');
        
        // Books on middle shelf
        r(4, 7, 1, 2, '#B8860B'); r(5, 7, 1, 2, '#9932CC');
        r(6, 7, 1, 2, '#FF6347'); r(8, 7, 1, 2, '#20B2AA');
        r(9, 7, 1, 2, '#CD853F');
        
        // Books on bottom shelf
        r(4, 11, 1, 2, '#2E8B57'); r(5, 11, 1, 2, '#8B0000');
        r(7, 11, 1, 2, '#000080'); r(8, 11, 1, 2, '#8B008B');
        
        // Binder
        r(10, 11, 2, 2, '#000000');
        px(11, 12, '#C0C0C0');
    },

    _drawConferenceTable(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Table surface (large oval)
        r(2, 6, 12, 8, '#8B4513');
        r(3, 5, 10, 10, '#A0522D');
        r(4, 4, 8, 12, '#A0522D');
        
        // Wood grain
        px(5, 7, '#654321'); px(8, 7, '#654321'); px(11, 7, '#654321');
        px(6, 10, '#654321'); px(9, 10, '#654321'); px(12, 10, '#654321');
        
        // Table legs (multiple)
        r(3, 13, 1, 2, '#654321'); r(6, 13, 1, 2, '#654321');
        r(9, 13, 1, 2, '#654321'); r(12, 13, 1, 2, '#654321');
        
        // Documents on table
        r(5, 8, 2, 3, '#FFFFFF');
        r(8, 7, 3, 2, '#F5F5F5');
        
        // Coffee cups
        px(7, 6, '#8B4513'); px(10, 9, '#654321');
        
        // Pen
        px(6, 9, '#1E90FF');
    },

    _drawWaterCooler(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Base cabinet
        r(5, 10, 6, 5, '#2F2F2F');
        r(6, 11, 4, 3, '#404040');
        
        // Water jug on top
        r(6, 4, 4, 6, '#87CEEB');
        r(7, 5, 2, 4, '#ADD8E6');
        
        // Water level
        r(7, 7, 2, 2, '#4682B4');
        
        // Dispenser spouts
        px(5, 9, '#C0C0C0'); px(10, 9, '#C0C0C0');
        
        // Cups dispenser
        r(4, 8, 2, 2, '#FFFFFF');
        px(4, 9, '#F0F0F0');
        
        // Little drip tray
        r(5, 9, 6, 1, '#808080');
        
        // Brand label
        r(7, 6, 2, 1, '#FFFFFF');
    },

    _drawCopyMachine(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Main body
        r(2, 6, 12, 9, '#F5F5F5');
        r(3, 7, 10, 7, '#E0E0E0');
        
        // Scanner lid
        r(3, 3, 10, 4, '#D3D3D3');
        r(4, 4, 8, 2, '#C0C0C0');
        
        // Control panel
        r(10, 5, 3, 2, '#2F2F2F');
        
        // Buttons
        px(11, 6, '#00FF00'); px(12, 6, '#FF0000');
        
        // Paper tray
        r(2, 8, 2, 4, '#FFFFFF');
        px(2, 9, '#F0F0F0'); px(2, 10, '#F0F0F0');
        
        // Output tray
        r(12, 10, 2, 3, '#FFFFFF');
        
        // Brand logo
        r(5, 8, 3, 1, '#1E90FF');
        
        // Paper jam indicator
        px(11, 5, '#FFD700');
    },

    _drawComputerDesk(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Desk base
        r(1, 8, 14, 7, '#8B4513');
        r(2, 9, 12, 6, '#A0522D');
        
        // Monitor
        r(5, 3, 6, 5, '#2F2F2F');
        r(6, 4, 4, 3, '#000080'); // blue screen
        px(7, 5, '#FFFFFF'); px(8, 5, '#FFFFFF'); // cursor
        
        // Monitor stand
        r(7, 7, 2, 2, '#404040');
        
        // Keyboard
        r(4, 10, 8, 3, '#F5F5F5');
        px(5, 11, '#2F2F2F'); px(6, 11, '#2F2F2F'); px(7, 11, '#2F2F2F');
        px(8, 11, '#2F2F2F'); px(9, 11, '#2F2F2F'); px(10, 11, '#2F2F2F');
        
        // Mouse
        r(12, 10, 2, 2, '#C0C0C0');
        px(13, 11, '#FF0000'); // red light
        
        // Speakers
        r(2, 5, 2, 3, '#1C1C1C');
        r(12, 5, 2, 3, '#1C1C1C');
        px(3, 6, '#404040'); px(13, 6, '#404040'); // speaker grills
        
        // Cables
        px(8, 8, '#000000'); px(9, 9, '#000000');
    },

    // ═══════════════════════════════════════════
    // DECORATIVE ELEMENTS
    // ═══════════════════════════════════════════

    _drawPottedPlant(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Pot
        r(5, 11, 6, 4, '#8B4513');
        r(6, 12, 4, 2, '#A0522D');
        
        // Soil
        r(6, 11, 4, 2, '#654321');
        
        // Plant stem
        px(8, 10, '#228B22'); px(8, 9, '#228B22');
        px(8, 8, '#228B22');
        
        // Leaves
        px(7, 7, '#32CD32'); px(9, 7, '#32CD32');
        px(6, 8, '#228B22'); px(10, 8, '#228B22');
        px(7, 6, '#228B22'); px(8, 5, '#32CD32'); px(9, 6, '#228B22');
        px(6, 9, '#32CD32'); px(10, 9, '#32CD32');
        
        // Small flowers
        px(7, 5, '#FF69B4'); px(9, 7, '#FFB6C1');
        
        // Pot rim
        r(5, 11, 6, 1, '#654321');
    },

    _drawPresidentPoster(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Poster background
        r(2, 2, 12, 12, '#DC143C');
        r(3, 3, 10, 10, '#B22222');
        
        // Frame
        r(2, 2, 12, 1, '#2F2F2F');
        r(2, 13, 12, 1, '#2F2F2F');
        r(2, 2, 1, 12, '#2F2F2F');
        r(13, 2, 1, 12, '#2F2F2F');
        
        // Presidential silhouette (devil)
        r(6, 5, 4, 6, '#000000'); // body
        r(7, 4, 2, 2, '#000000'); // head
        
        // Devil horns
        px(6, 4, '#8B0000'); px(9, 4, '#8B0000');
        px(6, 3, '#8B0000'); px(9, 3, '#8B0000');
        
        // Glowing red eyes
        px(7, 5, '#FF0000'); px(8, 5, '#FF0000');
        
        // Text area (simplified)
        r(4, 11, 8, 2, '#FFFFFF');
        px(5, 12, '#000000'); px(6, 12, '#000000'); // "VOTE"
        px(10, 12, '#000000'); px(11, 12, '#000000');
        
        // Stars decoration
        px(4, 4, '#FFD700'); px(11, 4, '#FFD700');
        px(4, 9, '#FFD700'); px(11, 9, '#FFD700');
    },

    _drawScatteredPapers(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Paper 1 (crumpled)
        r(2, 3, 4, 3, '#F5F5F5');
        px(3, 4, '#E0E0E0'); px(4, 5, '#E0E0E0');
        px(2, 5, '#D3D3D3'); // shadow
        
        // Paper 2 (flat)
        r(7, 6, 3, 4, '#FFFFFF');
        px(8, 7, '#000000'); px(9, 7, '#000000'); // text lines
        px(8, 8, '#000000'); px(7, 9, '#000000');
        
        // Paper 3 (torn corner)
        r(10, 2, 4, 3, '#F0F0F0');
        px(13, 2, '#FFFFFF'); // missing corner
        px(11, 3, '#000000'); // text
        
        // Paper 4 (small note)
        r(3, 9, 2, 3, '#FFFF99'); // yellow sticky note
        px(3, 10, '#FF0000'); // urgent text
        
        // Paper 5 (stamped document)
        r(8, 11, 4, 3, '#FFFFFF');
        px(10, 12, '#FF0000'); px(11, 12, '#FF0000'); // red stamp
        
        // Coffee stain
        px(9, 8, '#8B4513'); px(10, 8, '#8B4513');
        
        // Paperclip
        px(12, 7, '#C0C0C0');
    },

    _drawCoffeeMachine(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Machine body
        r(4, 4, 8, 10, '#2F2F2F');
        r(5, 5, 6, 8, '#404040');
        
        // Water reservoir (clear)
        r(9, 6, 2, 4, '#87CEEB');
        r(10, 7, 1, 2, '#4682B4'); // water level
        
        // Coffee pot
        r(5, 10, 4, 3, '#1C1C1C');
        r(6, 11, 2, 1, '#8B4513'); // coffee
        
        // Handle
        px(4, 11, '#2F2F2F'); px(4, 12, '#2F2F2F');
        
        // Hot plate
        r(5, 13, 4, 1, '#FF4500');
        px(6, 13, '#FF6347'); px(8, 13, '#FF6347'); // heating elements
        
        // Control panel
        r(6, 6, 2, 2, '#1C1C1C');
        px(6, 6, '#00FF00'); // power light
        px(7, 7, '#FF0000'); // brew button
        
        // Steam
        px(7, 4, '#F5F5F5'); px(8, 3, '#F5F5F5');
        
        // Brand label
        r(6, 8, 2, 1, '#FFFFFF');
    },

    _drawTrashBin(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Bin body
        r(5, 8, 6, 7, '#2F2F2F');
        r(6, 9, 4, 5, '#404040');
        
        // Rim
        r(4, 7, 8, 2, '#555555');
        r(5, 8, 6, 1, '#666666');
        
        // Vertical ridges
        px(6, 10, '#2F2F2F'); px(6, 12, '#2F2F2F');
        px(9, 10, '#2F2F2F'); px(9, 12, '#2F2F2F');
        
        // Trash inside
        px(7, 10, '#FFFFFF'); // paper
        px(8, 11, '#8B4513'); // banana peel
        px(7, 12, '#C0C0C0'); // can
        px(8, 9, '#FF0000'); // wrapper
        
        // Base
        r(5, 14, 6, 1, '#1C1C1C');
        
        // Dent
        px(8, 13, '#1C1C1C');
    },

    // ═══════════════════════════════════════════
    // ADDITIONAL OFFICE ELEMENTS
    // ═══════════════════════════════════════════

    _drawWhiteboard(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Board frame 
        r(2, 2, 12, 10, '#2F2F2F');
        r(3, 3, 10, 8, '#F5F5F5');
        
        // Writing on board (meeting notes)
        px(5, 4, '#0000FF'); px(6, 4, '#0000FF'); px(7, 4, '#0000FF'); // "PLAN"
        px(5, 6, '#FF0000'); px(6, 6, '#FF0000'); // bullet points
        px(8, 6, '#000000'); px(9, 6, '#000000'); px(10, 6, '#000000');
        px(5, 7, '#FF0000');
        px(8, 7, '#000000'); px(9, 7, '#000000'); px(10, 7, '#000000');
        
        // Marker tray
        r(3, 11, 10, 1, '#808080');
        px(4, 11, '#FF0000'); px(6, 11, '#0000FF'); px(8, 11, '#000000'); // markers
        
        // Eraser marks
        px(11, 5, '#E0E0E0'); px(12, 5, '#E0E0E0');
        px(11, 8, '#E0E0E0'); px(12, 8, '#E0E0E0');
    },

    _drawOfficePhone(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Phone base
        r(5, 8, 6, 6, '#1C1C1C');
        r(6, 9, 4, 4, '#2F2F2F');
        
        // Handset
        r(4, 5, 8, 3, '#1C1C1C');
        r(5, 6, 6, 1, '#2F2F2F');
        
        // Cord (connecting handset to base)
        px(8, 8, '#000000'); 
        px(7, 9, '#000000'); px(9, 9, '#000000');
        px(8, 10, '#000000');
        
        // Number pad
        px(7, 10, '#404040'); px(8, 10, '#404040'); px(9, 10, '#404040');
        px(7, 11, '#404040'); px(8, 11, '#404040'); px(9, 11, '#404040');
        px(7, 12, '#404040'); px(8, 12, '#404040'); px(9, 12, '#404040');
        
        // LED light (message waiting)
        px(6, 10, '#FF0000');
    },

    _drawDeskLamp(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Lamp base
        r(6, 11, 4, 4, '#2F2F2F');
        r(7, 12, 2, 2, '#404040');
        
        // Lamp arm
        px(8, 11, '#555555');
        px(9, 10, '#555555'); px(9, 9, '#555555');
        px(10, 8, '#555555'); px(11, 7, '#555555');
        
        // Lamp head
        r(10, 4, 4, 4, '#666666');
        r(11, 5, 2, 2, '#FFFF99'); // light glow
        
        // Power cord
        px(6, 14, '#000000'); px(5, 15, '#000000');
        
        // Light beam effect
        px(12, 8, '#FFFFCC'); px(13, 9, '#FFFFCC');
        px(12, 10, '#FFFFCC'); px(13, 11, '#FFFFCC');
    },

    _drawSafe(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Safe body
        r(4, 6, 8, 9, '#2F2F2F');
        r(5, 7, 6, 7, '#404040');
        
        // Door
        r(5, 7, 6, 6, '#555555');
        
        // Combination dial
        r(7, 9, 2, 2, '#C0C0C0');
        px(8, 10, '#1C1C1C'); // center dot
        
        // Handle
        r(11, 9, 1, 2, '#C0C0C0');
        
        // Hinges
        px(5, 8, '#808080'); px(5, 11, '#808080');
        
        // Brand plate
        r(6, 8, 3, 1, '#FFD700');
        
        // Lock indicator
        px(9, 8, '#FF0000'); // locked
    },

    _drawVendingMachine(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Machine body
        r(3, 1, 10, 14, '#FF4500');
        r(4, 2, 8, 12, '#FF6347');
        
        // Display window
        r(4, 3, 8, 6, '#000000');
        r(5, 4, 6, 4, '#1C1C1C');
        
        // Snack rows visible
        px(6, 5, '#FFD700'); px(8, 5, '#8B4513'); px(10, 5, '#FF69B4'); // row 1
        px(6, 6, '#32CD32'); px(8, 6, '#FF0000'); px(10, 6, '#9370DB'); // row 2
        px(6, 7, '#FFA500'); px(8, 7, '#00CED1'); px(10, 7, '#DC143C'); // row 3
        
        // Coin slot
        r(11, 10, 1, 3, '#1C1C1C');
        px(11, 11, '#C0C0C0');
        
        // Selection buttons
        px(5, 10, '#FFFFFF'); px(6, 10, '#FFFFFF'); px(7, 10, '#FFFFFF');
        px(8, 10, '#FFFFFF'); px(9, 10, '#FFFFFF'); px(10, 10, '#FFFFFF');
        
        // Dispenser slot
        r(4, 12, 8, 2, '#1C1C1C');
        
        // "OUT OF ORDER" message
        px(6, 11, '#FF0000'); px(7, 11, '#FF0000'); px(8, 11, '#FF0000');
    },

    _drawFireExtinguisher(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Extinguisher body
        r(6, 6, 4, 9, '#FF0000');
        r(7, 7, 2, 7, '#DC143C');
        
        // Top cap
        r(7, 5, 2, 2, '#2F2F2F');
        
        // Handle
        r(6, 5, 1, 3, '#1C1C1C');
        r(9, 5, 1, 3, '#1C1C1C');
        
        // Pressure gauge
        px(8, 8, '#FFFFFF');
        px(8, 9, '#FFFF00');
        
        // Hose
        px(6, 10, '#1C1C1C'); px(5, 11, '#1C1C1C');
        px(4, 12, '#1C1C1C'); px(4, 13, '#1C1C1C');
        
        // Nozzle
        r(3, 13, 2, 1, '#404040');
        
        // Mounting bracket
        px(10, 7, '#808080'); px(10, 9, '#808080');
        
        // Label
        r(7, 10, 2, 1, '#FFFFFF');
    },

    _drawPhotocopierPapers(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Paper stack 1 (tray overflow)
        r(2, 8, 3, 4, '#FFFFFF');
        r(2, 7, 3, 4, '#F5F5F5');
        px(3, 9, '#E0E0E0'); px(4, 10, '#E0E0E0'); // shadow
        
        // Paper stack 2 (floor mess) 
        r(6, 10, 4, 3, '#F0F0F0');
        r(7, 9, 3, 4, '#FFFFFF');
        px(8, 11, '#D3D3D3'); // crumple
        
        // Individual scattered sheets
        r(11, 5, 2, 3, '#FFFFFF');
        px(12, 6, '#000000'); // text line
        
        r(3, 3, 3, 2, '#F5F5F5');
        px(3, 4, '#000000'); px(4, 4, '#000000'); // text
        
        r(9, 12, 2, 2, '#FFFFFF');
        px(10, 13, '#FF0000'); // red marking
        
        // Paper jam pieces
        r(12, 8, 2, 1, '#F0F0F0');
        px(13, 8, '#000000'); // torn edge
        
        // Stapler on papers
        r(7, 7, 3, 1, '#808080');
        px(8, 7, '#C0C0C0'); // metal shine
    },

    _drawBrokenComputer(ctx) {
        const r = (x, y, w, h, c) => this._rect(ctx, x, y, w, h, c);
        const px = (x, y, c) => this._px(ctx, x, y, c);

        // Monitor (cracked)
        r(5, 3, 6, 5, '#2F2F2F');
        r(6, 4, 4, 3, '#000000'); // black screen
        
        // Crack in screen
        px(7, 4, '#404040'); px(8, 5, '#404040'); px(9, 6, '#404040');
        px(6, 5, '#404040'); px(8, 6, '#404040');
        
        // Sparks/damage
        px(6, 4, '#FFFF00'); px(9, 4, '#FF4500');
        
        // Monitor stand (broken)
        r(7, 7, 2, 2, '#404040');
        px(6, 8, '#1C1C1C'); // broken piece
        
        // Base/CPU unit (smoking)
        r(2, 8, 4, 6, '#1C1C1C');
        r(3, 9, 2, 4, '#2F2F2F');
        
        // Smoke coming out
        px(4, 7, '#808080'); px(5, 6, '#A0A0A0');
        px(3, 6, '#909090'); px(4, 5, '#B0B0B0');
        
        // Error lights
        px(3, 10, '#FF0000'); px(3, 11, '#FF0000'); // red error LEDs
        
        // Disconnected cables
        px(6, 9, '#000000'); px(7, 10, '#000000');
        px(5, 11, '#000000'); px(4, 12, '#000000');
        
        // "OUT OF ORDER" sticky note
        r(8, 8, 2, 1, '#FFFF99');
        px(8, 8, '#FF0000'); // red text
    },

};

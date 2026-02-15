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
        console.log('[TileSpriteGen] Generating tile textures...');

        const tiles = {
            // Walls
            tile_wall:           this._drawWall.bind(this),
            tile_wall_ritual:    this._drawWallRitual.bind(this),
            // Floors
            tile_floor_office:   this._drawFloorOffice.bind(this),
            tile_floor_corridor: this._drawFloorCorridor.bind(this),
            tile_floor_boss:     this._drawFloorBoss.bind(this),
            // Doors
            tile_door:           this._drawDoor.bind(this),
            tile_door_locked:    this._drawDoorLocked.bind(this),
            tile_door_sealed:    this._drawDoorSealed.bind(this),
            tile_door_shortcut:  this._drawDoorShortcut.bind(this),
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
            console.log(`[TileSpriteGen] ${texKey} created`);
        }

        console.log('[TileSpriteGen] All tile textures generated.');
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
            return 'tile_wall';
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
};

// ============================================
// President Devil — Runtime Enemy Sprite Generator
// ============================================
// Generates spritesheets for each enemy type on a canvas at startup.
// Each enemy gets a compact sheet: 16×16 frames (abomination 20×20).
//
// Per-type layout (each row):
//   Row 0: idle   (2 frames)
//   Row 1: move   (2 frames)
//   Row 2: attack (2 frames)
//   Row 3: hurt   (1 frame)
//   Row 4: death  (2 frames)

const ENEMY_SPRITE_GEN = {

    TYPES: {
        crawler: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#44aa44', bodyLight: '#66cc66', bodyDark: '#337733',
                eye: '#ffff44', pupil: '#222222', claw: '#88cc88',
                belly: '#55bb55', outline: '#1a331a', blood: '#aa1111',
            }
        },
        lurker: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#9944cc', bodyLight: '#bb66ee', bodyDark: '#773399',
                eye: '#ff4444', pupil: '#220000', tendril: '#aa55dd',
                hood: '#553388', outline: '#1a0a2a', blood: '#aa1111',
            }
        },
        brute: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#aa3333', bodyLight: '#cc5555', bodyDark: '#882222',
                eye: '#ffaa00', pupil: '#222222', fist: '#cc4444',
                armor: '#663333', outline: '#1a0a0a', blood: '#880000',
            }
        },
        shade: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#2a2a55', bodyLight: '#3a3a77', bodyDark: '#1a1a33',
                eye: '#8888ff', pupil: '#ffffff', wisp: '#4444aa',
                cloak: '#222244', outline: '#0a0a1a', blood: '#3333aa',
            }
        },
        abomination: {
            frameW: 20, frameH: 20, cols: 2, rows: 5,
            pal: {
                body: '#cc2222', bodyLight: '#ee4444', bodyDark: '#881111',
                eye: '#ffff00', pupil: '#000000', claw: '#ff6666',
                armor: '#881818', mouth: '#440000', outline: '#220000',
                blood: '#660000', glow: '#ff8800',
            }
        },
    },

    generate(scene) {
        for (const [typeName, cfg] of Object.entries(this.TYPES)) {
            const texKey = `enemy_${typeName}`;
            const W = cfg.frameW * cfg.cols;
            const H = cfg.frameH * cfg.rows;
            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            // Draw frames based on type
            this._drawEnemySheet(ctx, typeName, cfg);

            // Add to Phaser
            if (scene.textures.exists(texKey)) {
                scene.textures.remove(texKey);
            }
            scene.textures.addCanvas(texKey, canvas);

            // Register frames
            const texture = scene.textures.get(texKey);
            const frameCounts = [2, 2, 2, 1, 2]; // idle, move, attack, hurt, death
            for (let row = 0; row < cfg.rows; row++) {
                const count = frameCounts[row] || cfg.cols;
                for (let col = 0; col < count; col++) {
                    texture.add(
                        `r${row}_f${col}`, 0,
                        col * cfg.frameW, row * cfg.frameH,
                        cfg.frameW, cfg.frameH
                    );
                }
            }

            // Define animations
            this._defineAnims(scene, texKey, typeName);
        }
    },

    // ── Pixel helper ──
    _px(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    },

    // ── Main sheet drawer ──
    _drawEnemySheet(ctx, type, cfg) {
        switch (type) {
            case 'crawler':  this._drawCrawlerSheet(ctx, cfg); break;
            case 'lurker':   this._drawLurkerSheet(ctx, cfg); break;
            case 'brute':    this._drawBruteSheet(ctx, cfg); break;
            case 'shade':    this._drawShadeSheet(ctx, cfg); break;
            case 'abomination': this._drawAbominationSheet(ctx, cfg); break;
        }
    },

    // ═══════════════════════════════════════════
    // CRAWLER — Small, skittering insectoid
    // ═══════════════════════════════════════════
    _drawCrawlerSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawCrawler = (ox, oy, legPhase, mouthOpen) => {
            // Body (oval blob)
            px(ox+6, oy+5, p.bodyDark); px(ox+7, oy+5, p.body); px(ox+8, oy+5, p.body); px(ox+9, oy+5, p.bodyDark);
            px(ox+5, oy+6, p.bodyDark); px(ox+6, oy+6, p.body); px(ox+7, oy+6, p.bodyLight); px(ox+8, oy+6, p.bodyLight); px(ox+9, oy+6, p.body); px(ox+10, oy+6, p.bodyDark);
            px(ox+5, oy+7, p.body); px(ox+6, oy+7, p.bodyLight); px(ox+7, oy+7, p.eye); px(ox+8, oy+7, p.belly); px(ox+9, oy+7, p.eye); px(ox+10, oy+7, p.body);
            px(ox+5, oy+8, p.body); px(ox+6, oy+8, p.body); px(ox+7, oy+8, mouthOpen ? p.outline : p.body); px(ox+8, oy+8, mouthOpen ? p.outline : p.body); px(ox+9, oy+8, p.body); px(ox+10, oy+8, p.body);
            px(ox+6, oy+9, p.bodyDark); px(ox+7, oy+9, p.body); px(ox+8, oy+9, p.body); px(ox+9, oy+9, p.bodyDark);
            // Legs (3 pairs)
            const lo = legPhase ? 1 : 0;
            px(ox+4, oy+6+lo, p.claw); px(ox+11, oy+6+lo, p.claw);
            px(ox+4, oy+8-lo, p.claw); px(ox+11, oy+8-lo, p.claw);
            px(ox+3, oy+7, p.claw); px(ox+12, oy+7, p.claw);
        };

        // Row 0: idle
        drawCrawler(0, 0, false, false);
        drawCrawler(FW, 0, true, false);
        // Row 1: move
        drawCrawler(0, FH, false, false);
        drawCrawler(FW, FH, true, false);
        // Row 2: attack
        drawCrawler(0, FH*2, false, true);
        drawCrawler(FW, FH*2, true, true);
        // Row 3: hurt
        drawCrawler(0, FH*3, true, false);
        // Row 4: death
        drawCrawler(0, FH*4, false, false);
        // Flat splat for death frame 2
        px(FW+5, FH*4+8, p.bodyDark); px(FW+6, FH*4+8, p.body); px(FW+7, FH*4+8, p.body);
        px(FW+8, FH*4+8, p.body); px(FW+9, FH*4+8, p.body); px(FW+10, FH*4+8, p.bodyDark);
        px(FW+6, FH*4+9, p.blood); px(FW+7, FH*4+9, p.blood); px(FW+8, FH*4+9, p.blood); px(FW+9, FH*4+9, p.blood);
    },

    // ═══════════════════════════════════════════
    // LURKER — Tall, hooded, ghostly stalker
    // ═══════════════════════════════════════════
    _drawLurkerSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawLurker = (ox, oy, sway, tendrils) => {
            // Hood/head
            px(ox+6, oy+2, p.hood); px(ox+7, oy+2, p.hood); px(ox+8, oy+2, p.hood); px(ox+9, oy+2, p.hood);
            px(ox+5, oy+3, p.hood); px(ox+6, oy+3, p.bodyDark); px(ox+7, oy+3, p.bodyDark); px(ox+8, oy+3, p.bodyDark); px(ox+9, oy+3, p.bodyDark); px(ox+10, oy+3, p.hood);
            px(ox+5, oy+4, p.hood); px(ox+6, oy+4, p.body); px(ox+7, oy+4, p.eye); px(ox+8, oy+4, p.bodyDark); px(ox+9, oy+4, p.eye); px(ox+10, oy+4, p.hood);
            px(ox+6, oy+5, p.bodyDark); px(ox+7, oy+5, p.bodyDark); px(ox+8, oy+5, p.bodyDark); px(ox+9, oy+5, p.bodyDark);
            // Body (robe)
            const sx = sway;
            px(ox+6+sx, oy+6, p.body); px(ox+7+sx, oy+6, p.bodyLight); px(ox+8+sx, oy+6, p.bodyLight); px(ox+9+sx, oy+6, p.body);
            px(ox+5+sx, oy+7, p.body); px(ox+6+sx, oy+7, p.body); px(ox+7+sx, oy+7, p.bodyLight); px(ox+8+sx, oy+7, p.bodyLight); px(ox+9+sx, oy+7, p.body); px(ox+10+sx, oy+7, p.body);
            px(ox+5+sx, oy+8, p.bodyDark); px(ox+6+sx, oy+8, p.body); px(ox+7+sx, oy+8, p.body); px(ox+8+sx, oy+8, p.body); px(ox+9+sx, oy+8, p.body); px(ox+10+sx, oy+8, p.bodyDark);
            px(ox+5+sx, oy+9, p.bodyDark); px(ox+6+sx, oy+9, p.bodyDark); px(ox+7+sx, oy+9, p.body); px(ox+8+sx, oy+9, p.body); px(ox+9+sx, oy+9, p.bodyDark); px(ox+10+sx, oy+9, p.bodyDark);
            px(ox+6+sx, oy+10, p.bodyDark); px(ox+7+sx, oy+10, p.body); px(ox+8+sx, oy+10, p.body); px(ox+9+sx, oy+10, p.bodyDark);
            // Tendrils
            if (tendrils) {
                px(ox+4, oy+7, p.tendril); px(ox+3, oy+8, p.tendril);
                px(ox+11, oy+7, p.tendril); px(ox+12, oy+8, p.tendril);
            }
            // Bottom wisps
            px(ox+6+sx, oy+11, p.bodyDark); px(ox+9+sx, oy+11, p.bodyDark);
            px(ox+7+sx, oy+12, p.outline); px(ox+8+sx, oy+12, p.outline);
        };

        // Row 0: idle
        drawLurker(0, 0, 0, false);
        drawLurker(FW, 0, 0, false);
        // Row 1: move (sway)
        drawLurker(0, FH, 0, false);
        drawLurker(FW, FH, 1, false);
        // Row 2: attack (tendrils out)
        drawLurker(0, FH*2, 0, true);
        drawLurker(FW, FH*2, 0, true);
        // Row 3: hurt
        drawLurker(0, FH*3, -1, false);
        // Row 4: death
        drawLurker(0, FH*4, 0, false);
        // Collapsed pile
        px(FW+5, FH*4+7, p.hood); px(FW+6, FH*4+7, p.hood); px(FW+7, FH*4+7, p.bodyDark); px(FW+8, FH*4+7, p.bodyDark); px(FW+9, FH*4+7, p.hood); px(FW+10, FH*4+7, p.hood);
        px(FW+5, FH*4+8, p.body); px(FW+6, FH*4+8, p.body); px(FW+7, FH*4+8, p.body); px(FW+8, FH*4+8, p.body); px(FW+9, FH*4+8, p.body); px(FW+10, FH*4+8, p.body);
        px(FW+6, FH*4+9, p.blood); px(FW+7, FH*4+9, p.blood); px(FW+8, FH*4+9, p.blood); px(FW+9, FH*4+9, p.blood);
    },

    // ═══════════════════════════════════════════
    // BRUTE — Big, hulking tank with fists
    // ═══════════════════════════════════════════
    _drawBruteSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawBrute = (ox, oy, armUp, mouthOpen) => {
            // Head
            px(ox+6, oy+2, p.bodyDark); px(ox+7, oy+2, p.body); px(ox+8, oy+2, p.body); px(ox+9, oy+2, p.bodyDark);
            px(ox+5, oy+3, p.body); px(ox+6, oy+3, p.bodyLight); px(ox+7, oy+3, p.eye); px(ox+8, oy+3, p.bodyLight); px(ox+9, oy+3, p.eye); px(ox+10, oy+3, p.body);
            px(ox+6, oy+4, p.body); px(ox+7, oy+4, mouthOpen ? p.outline : p.body); px(ox+8, oy+4, mouthOpen ? p.outline : p.body); px(ox+9, oy+4, p.body);
            // Neck
            px(ox+7, oy+5, p.body); px(ox+8, oy+5, p.body);
            // Torso (wide)
            px(ox+4, oy+6, p.armor); px(ox+5, oy+6, p.body); px(ox+6, oy+6, p.bodyLight); px(ox+7, oy+6, p.bodyLight); px(ox+8, oy+6, p.bodyLight); px(ox+9, oy+6, p.bodyLight); px(ox+10, oy+6, p.body); px(ox+11, oy+6, p.armor);
            px(ox+4, oy+7, p.armor); px(ox+5, oy+7, p.body); px(ox+6, oy+7, p.body); px(ox+7, oy+7, p.bodyLight); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.body); px(ox+10, oy+7, p.body); px(ox+11, oy+7, p.armor);
            px(ox+5, oy+8, p.bodyDark); px(ox+6, oy+8, p.body); px(ox+7, oy+8, p.body); px(ox+8, oy+8, p.body); px(ox+9, oy+8, p.body); px(ox+10, oy+8, p.bodyDark);
            px(ox+5, oy+9, p.armor); px(ox+6, oy+9, p.bodyDark); px(ox+7, oy+9, p.body); px(ox+8, oy+9, p.body); px(ox+9, oy+9, p.bodyDark); px(ox+10, oy+9, p.armor);
            // Arms (thick)
            const armY = armUp ? 4 : 6;
            px(ox+3, oy+armY, p.body); px(ox+3, oy+armY+1, p.body); px(ox+3, oy+armY+2, p.fist); px(ox+2, oy+armY+2, p.fist);
            px(ox+12, oy+armY, p.body); px(ox+12, oy+armY+1, p.body); px(ox+12, oy+armY+2, p.fist); px(ox+13, oy+armY+2, p.fist);
            // Legs
            px(ox+6, oy+10, p.bodyDark); px(ox+7, oy+10, p.bodyDark);
            px(ox+9, oy+10, p.bodyDark); px(ox+10, oy+10, p.bodyDark);
            px(ox+6, oy+11, p.bodyDark); px(ox+7, oy+11, p.outline);
            px(ox+9, oy+11, p.bodyDark); px(ox+10, oy+11, p.outline);
        };

        // Row 0: idle
        drawBrute(0, 0, false, false);
        drawBrute(FW, 0, false, false);
        // Row 1: move
        drawBrute(0, FH, false, false);
        drawBrute(FW, FH, false, false);
        // Row 2: attack (arms up + mouth)
        drawBrute(0, FH*2, true, true);
        drawBrute(FW, FH*2, false, true);
        // Row 3: hurt
        drawBrute(0, FH*3, false, true);
        // Row 4: death
        drawBrute(0, FH*4, false, false);
        // Collapsed heap
        px(FW+4, FH*4+7, p.armor); px(FW+5, FH*4+7, p.body); px(FW+6, FH*4+7, p.body); px(FW+7, FH*4+7, p.bodyLight);
        px(FW+8, FH*4+7, p.bodyLight); px(FW+9, FH*4+7, p.body); px(FW+10, FH*4+7, p.body); px(FW+11, FH*4+7, p.armor);
        px(FW+5, FH*4+8, p.body); px(FW+6, FH*4+8, p.body); px(FW+7, FH*4+8, p.body); px(FW+8, FH*4+8, p.body); px(FW+9, FH*4+8, p.body); px(FW+10, FH*4+8, p.body);
        px(FW+6, FH*4+9, p.blood); px(FW+7, FH*4+9, p.blood); px(FW+8, FH*4+9, p.blood); px(FW+9, FH*4+9, p.blood);
    },

    // ═══════════════════════════════════════════
    // SHADE — Ghostly, translucent wraith
    // ═══════════════════════════════════════════
    _drawShadeSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawShade = (ox, oy, phase, attacking) => {
            const drift = phase;
            // Ethereal head
            px(ox+7, oy+3+drift, p.cloak); px(ox+8, oy+3+drift, p.cloak);
            px(ox+6, oy+4+drift, p.cloak); px(ox+7, oy+4+drift, p.bodyLight); px(ox+8, oy+4+drift, p.bodyLight); px(ox+9, oy+4+drift, p.cloak);
            px(ox+6, oy+5+drift, p.body); px(ox+7, oy+5+drift, p.eye); px(ox+8, oy+5+drift, p.eye); px(ox+9, oy+5+drift, p.body);
            px(ox+7, oy+6+drift, p.bodyDark); px(ox+8, oy+6+drift, p.bodyDark);
            // Wispy body
            px(ox+6, oy+7, p.body); px(ox+7, oy+7, p.bodyLight); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.body);
            px(ox+5, oy+8, p.bodyDark); px(ox+6, oy+8, p.body); px(ox+7, oy+8, p.body); px(ox+8, oy+8, p.body); px(ox+9, oy+8, p.body); px(ox+10, oy+8, p.bodyDark);
            px(ox+6, oy+9, p.bodyDark); px(ox+7, oy+9, p.body); px(ox+8, oy+9, p.body); px(ox+9, oy+9, p.bodyDark);
            // Trailing wisps (no legs — floating)
            px(ox+5, oy+10, p.wisp); px(ox+7, oy+10, p.bodyDark); px(ox+8, oy+10, p.bodyDark); px(ox+10, oy+10, p.wisp);
            px(ox+6, oy+11, p.wisp); px(ox+9, oy+11, p.wisp);
            // Attack claws
            if (attacking) {
                px(ox+4, oy+7, p.wisp); px(ox+3, oy+8, p.wisp); px(ox+2, oy+9, p.eye);
                px(ox+11, oy+7, p.wisp); px(ox+12, oy+8, p.wisp); px(ox+13, oy+9, p.eye);
            }
        };

        // Row 0: idle (float)
        drawShade(0, 0, 0, false);
        drawShade(FW, 0, -1, false);
        // Row 1: move
        drawShade(0, FH, 0, false);
        drawShade(FW, FH, -1, false);
        // Row 2: attack
        drawShade(0, FH*2, 0, true);
        drawShade(FW, FH*2, -1, true);
        // Row 3: hurt
        drawShade(0, FH*3, 1, false);
        // Row 4: death
        drawShade(0, FH*4, 0, false);
        // Dissipating wisps
        px(FW+6, FH*4+8, p.wisp); px(FW+8, FH*4+7, p.wisp); px(FW+10, FH*4+8, p.wisp);
        px(FW+5, FH*4+9, p.bodyDark); px(FW+7, FH*4+9, p.bodyDark); px(FW+9, FH*4+9, p.bodyDark); px(FW+11, FH*4+9, p.bodyDark);
        px(FW+6, FH*4+10, p.blood); px(FW+8, FH*4+10, p.blood); px(FW+10, FH*4+10, p.blood);
    },

    // ═══════════════════════════════════════════
    // ABOMINATION — Large, terrifying boss
    // ═══════════════════════════════════════════
    _drawAbominationSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawAbom = (ox, oy, armState, mouthOpen) => {
            // Massive head (wider)
            px(ox+7, oy+2, p.bodyDark); px(ox+8, oy+2, p.body); px(ox+9, oy+2, p.body); px(ox+10, oy+2, p.body); px(ox+11, oy+2, p.bodyDark);
            px(ox+6, oy+3, p.body); px(ox+7, oy+3, p.bodyLight); px(ox+8, oy+3, p.bodyLight); px(ox+9, oy+3, p.bodyLight); px(ox+10, oy+3, p.bodyLight); px(ox+11, oy+3, p.body); px(ox+12, oy+3, p.bodyDark);
            // Eyes (3 eyes!)
            px(ox+6, oy+4, p.bodyDark); px(ox+7, oy+4, p.eye); px(ox+8, oy+4, p.bodyLight); px(ox+9, oy+4, p.eye); px(ox+10, oy+4, p.bodyLight); px(ox+11, oy+4, p.eye); px(ox+12, oy+4, p.bodyDark);
            // Mouth
            px(ox+7, oy+5, p.body); px(ox+8, oy+5, mouthOpen ? p.mouth : p.body); px(ox+9, oy+5, mouthOpen ? p.mouth : p.body); px(ox+10, oy+5, mouthOpen ? p.mouth : p.body); px(ox+11, oy+5, p.body);
            if (mouthOpen) { px(ox+8, oy+5, p.glow); px(ox+10, oy+5, p.glow); }
            // Neck
            px(ox+8, oy+6, p.body); px(ox+9, oy+6, p.body); px(ox+10, oy+6, p.body);
            // Massive torso
            px(ox+5, oy+7, p.armor); px(ox+6, oy+7, p.body); px(ox+7, oy+7, p.bodyLight); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.bodyLight); px(ox+10, oy+7, p.bodyLight); px(ox+11, oy+7, p.bodyLight); px(ox+12, oy+7, p.body); px(ox+13, oy+7, p.armor);
            px(ox+4, oy+8, p.armor); px(ox+5, oy+8, p.body); px(ox+6, oy+8, p.bodyLight); px(ox+7, oy+8, p.body); px(ox+8, oy+8, p.bodyLight); px(ox+9, oy+8, p.glow); px(ox+10, oy+8, p.bodyLight); px(ox+11, oy+8, p.body); px(ox+12, oy+8, p.bodyLight); px(ox+13, oy+8, p.body); px(ox+14, oy+8, p.armor);
            px(ox+4, oy+9, p.armor); px(ox+5, oy+9, p.bodyDark); px(ox+6, oy+9, p.body); px(ox+7, oy+9, p.body); px(ox+8, oy+9, p.body); px(ox+9, oy+9, p.body); px(ox+10, oy+9, p.body); px(ox+11, oy+9, p.body); px(ox+12, oy+9, p.body); px(ox+13, oy+9, p.bodyDark); px(ox+14, oy+9, p.armor);
            px(ox+5, oy+10, p.bodyDark); px(ox+6, oy+10, p.bodyDark); px(ox+7, oy+10, p.body); px(ox+8, oy+10, p.body); px(ox+9, oy+10, p.body); px(ox+10, oy+10, p.body); px(ox+11, oy+10, p.body); px(ox+12, oy+10, p.bodyDark); px(ox+13, oy+10, p.bodyDark);
            // Arms
            if (armState === 0) {
                px(ox+3, oy+8, p.body); px(ox+3, oy+9, p.body); px(ox+2, oy+10, p.claw); px(ox+2, oy+9, p.body);
                px(ox+15, oy+8, p.body); px(ox+15, oy+9, p.body); px(ox+16, oy+10, p.claw); px(ox+16, oy+9, p.body);
            } else {
                px(ox+3, oy+6, p.body); px(ox+2, oy+5, p.body); px(ox+1, oy+4, p.claw); px(ox+1, oy+5, p.claw);
                px(ox+15, oy+6, p.body); px(ox+16, oy+5, p.body); px(ox+17, oy+4, p.claw); px(ox+17, oy+5, p.claw);
            }
            // Legs (thick stumps)
            px(ox+6, oy+11, p.bodyDark); px(ox+7, oy+11, p.bodyDark); px(ox+8, oy+11, p.bodyDark);
            px(ox+10, oy+11, p.bodyDark); px(ox+11, oy+11, p.bodyDark); px(ox+12, oy+11, p.bodyDark);
            px(ox+6, oy+12, p.outline); px(ox+7, oy+12, p.bodyDark); px(ox+8, oy+12, p.outline);
            px(ox+10, oy+12, p.outline); px(ox+11, oy+12, p.bodyDark); px(ox+12, oy+12, p.outline);
        };

        // Row 0: idle
        drawAbom(0, 0, 0, false);
        drawAbom(FW, 0, 0, false);
        // Row 1: move
        drawAbom(0, FH, 0, false);
        drawAbom(FW, FH, 0, true);
        // Row 2: attack (arms raised)
        drawAbom(0, FH*2, 1, true);
        drawAbom(FW, FH*2, 0, true);
        // Row 3: hurt
        drawAbom(0, FH*3, 0, true);
        // Row 4: death
        drawAbom(0, FH*4, 0, false);
        // Massive corpse puddle
        const dy = FH*4;
        for (let dx = 4; dx <= 14; dx++) { px(FW+dx, dy+8, p.bodyDark); }
        for (let dx = 5; dx <= 13; dx++) { px(FW+dx, dy+9, p.body); }
        for (let dx = 6; dx <= 12; dx++) { px(FW+dx, dy+10, p.blood); }
        for (let dx = 7; dx <= 11; dx++) { px(FW+dx, dy+11, p.blood); }
    },

    // ── Animation definitions ──
    _defineAnims(scene, texKey, typeName) {
        const anims = scene.anims;

        const rowFrames = (row, count) => {
            const frames = [];
            for (let i = 0; i < count; i++) {
                frames.push({ key: texKey, frame: `r${row}_f${i}` });
            }
            return frames;
        };

        const prefix = `enemy_${typeName}`;
        const defs = [
            { key: `${prefix}_idle`,   row: 0, count: 2, rate: 3,  repeat: -1 },
            { key: `${prefix}_move`,   row: 1, count: 2, rate: 5,  repeat: -1 },
            { key: `${prefix}_attack`, row: 2, count: 2, rate: 8,  repeat: 0 },
            { key: `${prefix}_hurt`,   row: 3, count: 1, rate: 4,  repeat: 0 },
            { key: `${prefix}_death`,  row: 4, count: 2, rate: 3,  repeat: 0 },
        ];

        for (const d of defs) {
            if (anims.exists(d.key)) anims.remove(d.key);
            anims.create({
                key: d.key,
                frames: rowFrames(d.row, d.count),
                frameRate: d.rate,
                repeat: d.repeat,
            });
        }
    }
};

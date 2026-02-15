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
                body: '#44aa44', bodyLight: '#66cc66', bodyDark: '#226622',
                eye: '#ffff00', pupil: '#111111', claw: '#22aa22',
                belly: '#88dd88', outline: '#113311', blood: '#cc1111',
                fang: '#ffffff',
            }
        },
        lurker: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#8833bb', bodyLight: '#aa55dd', bodyDark: '#552288',
                eye: '#ff3333', pupil: '#ffcccc', tendril: '#9944cc',
                hood: '#442266', outline: '#220044', blood: '#cc1111',
                inner: '#331155',
            }
        },
        brute: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#bb3333', bodyLight: '#dd5555', bodyDark: '#881818',
                eye: '#ffcc00', pupil: '#111111', fist: '#ffaa77',
                armor: '#553333', outline: '#220000', blood: '#880000',
                teeth: '#ffffff', belt: '#443322',
            }
        },
        shade: {
            frameW: 16, frameH: 16, cols: 2, rows: 5,
            pal: {
                body: '#3344aa', bodyLight: '#5566cc', bodyDark: '#222266',
                eye: '#aabbff', pupil: '#ffffff', wisp: '#4455bb',
                cloak: '#1a1a44', outline: '#0a0a22', blood: '#3333aa',
                glow: '#8899ff',
            }
        },
        abomination: {
            frameW: 20, frameH: 20, cols: 2, rows: 5,
            pal: {
                body: '#cc2222', bodyLight: '#ee4444', bodyDark: '#881111',
                eye: '#ffff00', pupil: '#000000', claw: '#ff8866',
                armor: '#661111', mouth: '#330000', outline: '#220000',
                blood: '#660000', glow: '#ff8800', teeth: '#ffffff',
            }
        },
    },

    generate(scene) {
        console.log('[EnemySpriteGen] Generating enemy spritesheets...');
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
            console.log(`[EnemySpriteGen] ${typeName}: ${W}x${H} canvas, texture=${texKey}, frames registered`);
        }
        console.log('[EnemySpriteGen] All enemy spritesheets generated successfully.');
    },

    // ── Pixel helper ──
    _px(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    },

    // ── Fill rect helper ──
    _rect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
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
    // CRAWLER — Skittering insectoid spider
    // Fills frame: x 2-13, y 3-13 (12px wide, 11px tall)
    // ═══════════════════════════════════════════
    _drawCrawlerSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawCrawler = (ox, oy, legPhase, mouthOpen) => {
            // Outline/shadow base
            px(ox+6, oy+4, p.outline); px(ox+7, oy+4, p.outline); px(ox+8, oy+4, p.outline); px(ox+9, oy+4, p.outline);

            // Body top
            px(ox+5, oy+5, p.outline); px(ox+6, oy+5, p.bodyDark); px(ox+7, oy+5, p.body); px(ox+8, oy+5, p.body); px(ox+9, oy+5, p.bodyDark); px(ox+10, oy+5, p.outline);

            // Body with eyes - row 6
            px(ox+4, oy+6, p.outline); px(ox+5, oy+6, p.bodyDark); px(ox+6, oy+6, p.body); px(ox+7, oy+6, p.bodyLight); px(ox+8, oy+6, p.bodyLight); px(ox+9, oy+6, p.body); px(ox+10, oy+6, p.bodyDark); px(ox+11, oy+6, p.outline);

            // Eyes row
            px(ox+4, oy+7, p.outline); px(ox+5, oy+7, p.body); px(ox+6, oy+7, p.eye); px(ox+7, oy+7, p.pupil); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.eye); px(ox+10, oy+7, p.pupil); px(ox+11, oy+7, p.body); px(ox+12, oy+7, p.outline);

            // Mouth row
            px(ox+4, oy+8, p.outline); px(ox+5, oy+8, p.body); px(ox+6, oy+8, p.bodyLight);
            px(ox+7, oy+8, mouthOpen ? p.fang : p.belly); px(ox+8, oy+8, mouthOpen ? p.outline : p.belly);
            px(ox+9, oy+8, mouthOpen ? p.fang : p.belly);
            px(ox+10, oy+8, p.bodyLight); px(ox+11, oy+8, p.body); px(ox+12, oy+8, p.outline);

            // Lower body
            px(ox+4, oy+9, p.outline); px(ox+5, oy+9, p.bodyDark); px(ox+6, oy+9, p.body); px(ox+7, oy+9, p.belly); px(ox+8, oy+9, p.belly); px(ox+9, oy+9, p.body); px(ox+10, oy+9, p.bodyDark); px(ox+11, oy+9, p.outline);

            // Bottom edge
            px(ox+5, oy+10, p.outline); px(ox+6, oy+10, p.bodyDark); px(ox+7, oy+10, p.body); px(ox+8, oy+10, p.body); px(ox+9, oy+10, p.bodyDark); px(ox+10, oy+10, p.outline);

            // Abdomen
            px(ox+6, oy+11, p.outline); px(ox+7, oy+11, p.bodyDark); px(ox+8, oy+11, p.bodyDark); px(ox+9, oy+11, p.outline);

            // Legs (4 pairs, alternating phase)
            const lo = legPhase ? 1 : 0;
            // Front legs
            px(ox+3, oy+6-lo, p.claw); px(ox+3, oy+7-lo, p.outline);
            px(ox+13, oy+6-lo, p.claw); px(ox+13, oy+7-lo, p.outline);
            // Mid-front legs
            px(ox+2, oy+7+lo, p.claw); px(ox+3, oy+8, p.outline);
            px(ox+13, oy+8, p.outline); px(ox+14, oy+7+lo, p.claw);
            // Mid-back legs
            px(ox+2, oy+9-lo, p.claw); px(ox+3, oy+9, p.outline);
            px(ox+13, oy+9, p.outline); px(ox+14, oy+9-lo, p.claw);
            // Back legs
            px(ox+3, oy+10+lo, p.claw); px(ox+4, oy+11, p.outline);
            px(ox+11, oy+11, p.outline); px(ox+12, oy+10+lo, p.claw);

            // Fangs/pincers
            if (mouthOpen) {
                px(ox+6, oy+9, p.fang); px(ox+9, oy+9, p.fang);
            }
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
        // Row 3: hurt (recoil)
        drawCrawler(0, FH*3, true, true);
        // Row 4: death frame 1
        drawCrawler(0, FH*4, false, false);
        // Row 4 frame 2: squished splat
        this._rect(ctx, FW+4, FH*4+8, 8, 2, p.bodyDark);
        this._rect(ctx, FW+5, FH*4+9, 6, 2, p.outline);
        this._rect(ctx, FW+6, FH*4+10, 4, 1, p.blood);
        px(FW+6, FH*4+8, p.body); px(FW+9, FH*4+8, p.body);
        px(FW+3, FH*4+9, p.claw); px(FW+12, FH*4+9, p.claw);
    },

    // ═══════════════════════════════════════════
    // LURKER — Hooded shadow stalker
    // Fills frame: x 3-12, y 1-14 (10px wide, 14px tall)
    // ═══════════════════════════════════════════
    _drawLurkerSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawLurker = (ox, oy, sway, tendrils) => {
            const s = sway;
            // Hood peak
            px(ox+7, oy+1, p.outline); px(ox+8, oy+1, p.outline);
            // Hood top
            px(ox+6, oy+2, p.outline); px(ox+7, oy+2, p.hood); px(ox+8, oy+2, p.hood); px(ox+9, oy+2, p.outline);
            // Hood sides + face shadow
            px(ox+5, oy+3, p.outline); px(ox+6, oy+3, p.hood); px(ox+7, oy+3, p.inner); px(ox+8, oy+3, p.inner); px(ox+9, oy+3, p.hood); px(ox+10, oy+3, p.outline);
            // Face with eyes
            px(ox+5, oy+4, p.outline); px(ox+6, oy+4, p.hood); px(ox+7, oy+4, p.eye); px(ox+8, oy+4, p.inner); px(ox+9, oy+4, p.eye); px(ox+10, oy+4, p.hood); px(ox+11, oy+4, p.outline);
            // Lower face / chin
            px(ox+5, oy+5, p.outline); px(ox+6, oy+5, p.bodyDark); px(ox+7, oy+5, p.inner); px(ox+8, oy+5, p.inner); px(ox+9, oy+5, p.inner); px(ox+10, oy+5, p.bodyDark); px(ox+11, oy+5, p.outline);

            // Shoulders
            px(ox+4+s, oy+6, p.outline); px(ox+5+s, oy+6, p.bodyDark); px(ox+6+s, oy+6, p.body); px(ox+7+s, oy+6, p.bodyLight); px(ox+8+s, oy+6, p.bodyLight); px(ox+9+s, oy+6, p.body); px(ox+10+s, oy+6, p.bodyDark); px(ox+11+s, oy+6, p.outline);
            // Upper robe
            px(ox+4+s, oy+7, p.outline); px(ox+5+s, oy+7, p.body); px(ox+6+s, oy+7, p.bodyLight); px(ox+7+s, oy+7, p.bodyLight); px(ox+8+s, oy+7, p.bodyLight); px(ox+9+s, oy+7, p.bodyLight); px(ox+10+s, oy+7, p.body); px(ox+11+s, oy+7, p.outline);
            // Mid robe
            px(ox+4+s, oy+8, p.outline); px(ox+5+s, oy+8, p.bodyDark); px(ox+6+s, oy+8, p.body); px(ox+7+s, oy+8, p.body); px(ox+8+s, oy+8, p.body); px(ox+9+s, oy+8, p.body); px(ox+10+s, oy+8, p.bodyDark); px(ox+11+s, oy+8, p.outline);
            // Lower robe
            px(ox+4+s, oy+9, p.outline); px(ox+5+s, oy+9, p.bodyDark); px(ox+6+s, oy+9, p.bodyDark); px(ox+7+s, oy+9, p.body); px(ox+8+s, oy+9, p.body); px(ox+9+s, oy+9, p.bodyDark); px(ox+10+s, oy+9, p.bodyDark); px(ox+11+s, oy+9, p.outline);
            // Robe bottom
            px(ox+5+s, oy+10, p.outline); px(ox+6+s, oy+10, p.bodyDark); px(ox+7+s, oy+10, p.body); px(ox+8+s, oy+10, p.body); px(ox+9+s, oy+10, p.bodyDark); px(ox+10+s, oy+10, p.outline);
            // Wispy hem
            px(ox+5+s, oy+11, p.outline); px(ox+6+s, oy+11, p.bodyDark); px(ox+7+s, oy+11, p.bodyDark); px(ox+8+s, oy+11, p.bodyDark); px(ox+9+s, oy+11, p.bodyDark); px(ox+10+s, oy+11, p.outline);
            // Trailing wisps
            px(ox+6+s, oy+12, p.outline); px(ox+7+s, oy+12, p.bodyDark); px(ox+8+s, oy+12, p.bodyDark); px(ox+9+s, oy+12, p.outline);
            px(ox+7+s, oy+13, p.outline); px(ox+8+s, oy+13, p.outline);

            // Tendrils (attack arms)
            if (tendrils) {
                px(ox+3, oy+6, p.tendril); px(ox+2, oy+7, p.tendril); px(ox+1, oy+8, p.eye);
                px(ox+12, oy+6, p.tendril); px(ox+13, oy+7, p.tendril); px(ox+14, oy+8, p.eye);
            }
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
        // Row 4: death frame 1
        drawLurker(0, FH*4, 0, false);
        // Row 4 frame 2: collapsed pile
        this._rect(ctx, FW+4, FH*4+8, 8, 1, p.hood);
        this._rect(ctx, FW+4, FH*4+9, 8, 2, p.bodyDark);
        this._rect(ctx, FW+5, FH*4+10, 6, 1, p.body);
        this._rect(ctx, FW+6, FH*4+11, 4, 1, p.blood);
        px(FW+7, FH*4+8, p.eye); px(FW+9, FH*4+8, p.eye);
    },

    // ═══════════════════════════════════════════
    // BRUTE — Hulking muscular tank
    // Fills frame: x 1-14, y 1-12 (14px wide, 12px tall)
    // ═══════════════════════════════════════════
    _drawBruteSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawBrute = (ox, oy, armUp, mouthOpen) => {
            // Head top
            px(ox+6, oy+1, p.outline); px(ox+7, oy+1, p.bodyDark); px(ox+8, oy+1, p.bodyDark); px(ox+9, oy+1, p.outline);
            // Forehead
            px(ox+5, oy+2, p.outline); px(ox+6, oy+2, p.body); px(ox+7, oy+2, p.bodyLight); px(ox+8, oy+2, p.bodyLight); px(ox+9, oy+2, p.body); px(ox+10, oy+2, p.outline);
            // Eyes
            px(ox+5, oy+3, p.outline); px(ox+6, oy+3, p.body); px(ox+7, oy+3, p.eye); px(ox+8, oy+3, p.bodyLight); px(ox+9, oy+3, p.eye); px(ox+10, oy+3, p.body); px(ox+11, oy+3, p.outline);
            // Jaw / mouth
            px(ox+5, oy+4, p.outline); px(ox+6, oy+4, p.bodyDark);
            px(ox+7, oy+4, mouthOpen ? p.teeth : p.body);
            px(ox+8, oy+4, mouthOpen ? p.outline : p.body);
            px(ox+9, oy+4, mouthOpen ? p.teeth : p.body);
            px(ox+10, oy+4, p.bodyDark); px(ox+11, oy+4, p.outline);
            // Neck
            px(ox+6, oy+5, p.outline); px(ox+7, oy+5, p.body); px(ox+8, oy+5, p.body); px(ox+9, oy+5, p.body); px(ox+10, oy+5, p.outline);

            // Massive torso - upper
            px(ox+3, oy+6, p.outline); px(ox+4, oy+6, p.armor); px(ox+5, oy+6, p.body); px(ox+6, oy+6, p.bodyLight); px(ox+7, oy+6, p.bodyLight); px(ox+8, oy+6, p.bodyLight); px(ox+9, oy+6, p.bodyLight); px(ox+10, oy+6, p.body); px(ox+11, oy+6, p.armor); px(ox+12, oy+6, p.outline);
            // Torso - mid
            px(ox+3, oy+7, p.outline); px(ox+4, oy+7, p.armor); px(ox+5, oy+7, p.body); px(ox+6, oy+7, p.bodyLight); px(ox+7, oy+7, p.bodyLight); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.bodyLight); px(ox+10, oy+7, p.body); px(ox+11, oy+7, p.armor); px(ox+12, oy+7, p.outline);
            // Torso - lower
            px(ox+3, oy+8, p.outline); px(ox+4, oy+8, p.bodyDark); px(ox+5, oy+8, p.body); px(ox+6, oy+8, p.body); px(ox+7, oy+8, p.bodyLight); px(ox+8, oy+8, p.bodyLight); px(ox+9, oy+8, p.body); px(ox+10, oy+8, p.body); px(ox+11, oy+8, p.bodyDark); px(ox+12, oy+8, p.outline);
            // Belt
            px(ox+4, oy+9, p.outline); px(ox+5, oy+9, p.belt); px(ox+6, oy+9, p.belt); px(ox+7, oy+9, p.belt); px(ox+8, oy+9, p.belt); px(ox+9, oy+9, p.belt); px(ox+10, oy+9, p.belt); px(ox+11, oy+9, p.outline);

            // Arms
            const armY = armUp ? 3 : 6;
            // Left arm
            px(ox+2, oy+armY, p.outline); px(ox+2, oy+armY+1, p.body); px(ox+2, oy+armY+2, p.bodyDark);
            px(ox+1, oy+armY+2, p.fist); px(ox+1, oy+armY+3, p.fist);
            // Right arm
            px(ox+13, oy+armY, p.outline); px(ox+13, oy+armY+1, p.body); px(ox+13, oy+armY+2, p.bodyDark);
            px(ox+14, oy+armY+2, p.fist); px(ox+14, oy+armY+3, p.fist);

            // Legs
            px(ox+5, oy+10, p.outline); px(ox+6, oy+10, p.bodyDark); px(ox+7, oy+10, p.bodyDark);
            px(ox+9, oy+10, p.bodyDark); px(ox+10, oy+10, p.bodyDark); px(ox+11, oy+10, p.outline);
            px(ox+5, oy+11, p.outline); px(ox+6, oy+11, p.body); px(ox+7, oy+11, p.outline);
            px(ox+9, oy+11, p.outline); px(ox+10, oy+11, p.body); px(ox+11, oy+11, p.outline);
            // Feet
            px(ox+5, oy+12, p.outline); px(ox+6, oy+12, p.bodyDark); px(ox+7, oy+12, p.outline);
            px(ox+9, oy+12, p.outline); px(ox+10, oy+12, p.bodyDark); px(ox+11, oy+12, p.outline);
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
        // Row 4: death frame 1
        drawBrute(0, FH*4, false, false);
        // Row 4 frame 2: collapsed heap
        this._rect(ctx, FW+3, FH*4+9, 10, 1, p.armor);
        this._rect(ctx, FW+4, FH*4+10, 8, 2, p.bodyDark);
        this._rect(ctx, FW+5, FH*4+11, 6, 1, p.body);
        this._rect(ctx, FW+6, FH*4+12, 4, 1, p.blood);
        px(FW+7, FH*4+9, p.eye); px(FW+9, FH*4+9, p.eye);
    },

    // ═══════════════════════════════════════════
    // SHADE — Ghostly wraith
    // Fills frame: x 3-12, y 2-14 (10px wide, 13px tall)
    // ═══════════════════════════════════════════
    _drawShadeSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawShade = (ox, oy, phase, attacking) => {
            const d = phase;
            // Crown/head top
            px(ox+7, oy+2+d, p.outline); px(ox+8, oy+2+d, p.outline);
            // Ethereal head
            px(ox+6, oy+3+d, p.outline); px(ox+7, oy+3+d, p.cloak); px(ox+8, oy+3+d, p.cloak); px(ox+9, oy+3+d, p.outline);
            // Face
            px(ox+5, oy+4+d, p.outline); px(ox+6, oy+4+d, p.bodyDark); px(ox+7, oy+4+d, p.bodyLight); px(ox+8, oy+4+d, p.bodyLight); px(ox+9, oy+4+d, p.bodyDark); px(ox+10, oy+4+d, p.outline);
            // Eyes
            px(ox+5, oy+5+d, p.outline); px(ox+6, oy+5+d, p.body); px(ox+7, oy+5+d, p.eye); px(ox+8, oy+5+d, p.glow); px(ox+9, oy+5+d, p.eye); px(ox+10, oy+5+d, p.body); px(ox+11, oy+5+d, p.outline);
            // Lower face
            px(ox+6, oy+6+d, p.outline); px(ox+7, oy+6+d, p.bodyDark); px(ox+8, oy+6+d, p.bodyDark); px(ox+9, oy+6+d, p.outline);

            // Wispy body (no drift offset)
            px(ox+5, oy+7, p.outline); px(ox+6, oy+7, p.body); px(ox+7, oy+7, p.bodyLight); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.body); px(ox+10, oy+7, p.outline);
            px(ox+4, oy+8, p.outline); px(ox+5, oy+8, p.bodyDark); px(ox+6, oy+8, p.body); px(ox+7, oy+8, p.bodyLight); px(ox+8, oy+8, p.bodyLight); px(ox+9, oy+8, p.body); px(ox+10, oy+8, p.bodyDark); px(ox+11, oy+8, p.outline);
            px(ox+4, oy+9, p.outline); px(ox+5, oy+9, p.bodyDark); px(ox+6, oy+9, p.body); px(ox+7, oy+9, p.body); px(ox+8, oy+9, p.body); px(ox+9, oy+9, p.body); px(ox+10, oy+9, p.bodyDark); px(ox+11, oy+9, p.outline);
            // Lower body narrows
            px(ox+5, oy+10, p.outline); px(ox+6, oy+10, p.bodyDark); px(ox+7, oy+10, p.body); px(ox+8, oy+10, p.body); px(ox+9, oy+10, p.bodyDark); px(ox+10, oy+10, p.outline);
            // Trailing wisps
            px(ox+4, oy+11, p.wisp); px(ox+6, oy+11, p.outline); px(ox+7, oy+11, p.bodyDark); px(ox+8, oy+11, p.bodyDark); px(ox+9, oy+11, p.outline); px(ox+11, oy+11, p.wisp);
            px(ox+3, oy+12, p.wisp); px(ox+7, oy+12, p.outline); px(ox+8, oy+12, p.outline); px(ox+12, oy+12, p.wisp);
            px(ox+5, oy+13, p.wisp); px(ox+10, oy+13, p.wisp);

            // Attack claws
            if (attacking) {
                px(ox+3, oy+7, p.wisp); px(ox+2, oy+8, p.glow); px(ox+1, oy+9, p.eye);
                px(ox+12, oy+7, p.wisp); px(ox+13, oy+8, p.glow); px(ox+14, oy+9, p.eye);
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
        // Row 4: death frame 1
        drawShade(0, FH*4, 0, false);
        // Row 4 frame 2: dissipating wisps
        px(FW+5, FH*4+8, p.wisp); px(FW+7, FH*4+7, p.wisp); px(FW+10, FH*4+8, p.wisp);
        px(FW+4, FH*4+9, p.bodyDark); px(FW+6, FH*4+9, p.outline); px(FW+8, FH*4+9, p.bodyDark); px(FW+11, FH*4+9, p.outline);
        px(FW+5, FH*4+10, p.outline); px(FW+7, FH*4+10, p.blood); px(FW+9, FH*4+10, p.outline);
        px(FW+6, FH*4+11, p.blood); px(FW+8, FH*4+11, p.blood); px(FW+10, FH*4+11, p.blood);
    },

    // ═══════════════════════════════════════════
    // ABOMINATION — Large, terrifying boss monster
    // Fills frame: x 1-18, y 1-15 (18px wide, 15px tall)
    // ═══════════════════════════════════════════
    _drawAbominationSheet(ctx, cfg) {
        const p = cfg.pal;
        const FW = cfg.frameW;
        const FH = cfg.frameH;
        const px = (x, y, c) => this._px(ctx, x, y, c);

        const drawAbom = (ox, oy, armState, mouthOpen) => {
            // Head top horns
            px(ox+6, oy+1, p.outline); px(ox+7, oy+1, p.bodyDark);
            px(ox+12, oy+1, p.bodyDark); px(ox+13, oy+1, p.outline);
            // Head
            px(ox+6, oy+2, p.outline); px(ox+7, oy+2, p.bodyDark); px(ox+8, oy+2, p.body); px(ox+9, oy+2, p.body); px(ox+10, oy+2, p.body); px(ox+11, oy+2, p.body); px(ox+12, oy+2, p.bodyDark); px(ox+13, oy+2, p.outline);
            // Upper face
            px(ox+5, oy+3, p.outline); px(ox+6, oy+3, p.body); px(ox+7, oy+3, p.bodyLight); px(ox+8, oy+3, p.bodyLight); px(ox+9, oy+3, p.bodyLight); px(ox+10, oy+3, p.bodyLight); px(ox+11, oy+3, p.bodyLight); px(ox+12, oy+3, p.body); px(ox+13, oy+3, p.outline);
            // Triple eyes row
            px(ox+5, oy+4, p.outline); px(ox+6, oy+4, p.body); px(ox+7, oy+4, p.eye); px(ox+8, oy+4, p.bodyLight); px(ox+9, oy+4, p.eye); px(ox+10, oy+4, p.bodyLight); px(ox+11, oy+4, p.eye); px(ox+12, oy+4, p.body); px(ox+13, oy+4, p.outline);
            // Mouth
            px(ox+6, oy+5, p.outline); px(ox+7, oy+5, p.body);
            px(ox+8, oy+5, mouthOpen ? p.teeth : p.body);
            px(ox+9, oy+5, mouthOpen ? p.mouth : p.body);
            px(ox+10, oy+5, mouthOpen ? p.teeth : p.body);
            px(ox+11, oy+5, mouthOpen ? p.mouth : p.body);
            px(ox+12, oy+5, p.body); px(ox+13, oy+5, p.outline);
            if (mouthOpen) { px(ox+9, oy+5, p.glow); px(ox+11, oy+5, p.glow); }
            // Chin
            px(ox+7, oy+6, p.outline); px(ox+8, oy+6, p.bodyDark); px(ox+9, oy+6, p.body); px(ox+10, oy+6, p.body); px(ox+11, oy+6, p.bodyDark); px(ox+12, oy+6, p.outline);

            // Massive torso
            px(ox+4, oy+7, p.outline); px(ox+5, oy+7, p.armor); px(ox+6, oy+7, p.body); px(ox+7, oy+7, p.bodyLight); px(ox+8, oy+7, p.bodyLight); px(ox+9, oy+7, p.bodyLight); px(ox+10, oy+7, p.bodyLight); px(ox+11, oy+7, p.bodyLight); px(ox+12, oy+7, p.body); px(ox+13, oy+7, p.armor); px(ox+14, oy+7, p.outline);
            px(ox+3, oy+8, p.outline); px(ox+4, oy+8, p.armor); px(ox+5, oy+8, p.body); px(ox+6, oy+8, p.bodyLight); px(ox+7, oy+8, p.body); px(ox+8, oy+8, p.bodyLight); px(ox+9, oy+8, p.glow); px(ox+10, oy+8, p.bodyLight); px(ox+11, oy+8, p.body); px(ox+12, oy+8, p.bodyLight); px(ox+13, oy+8, p.body); px(ox+14, oy+8, p.armor); px(ox+15, oy+8, p.outline);
            px(ox+3, oy+9, p.outline); px(ox+4, oy+9, p.armor); px(ox+5, oy+9, p.bodyDark); px(ox+6, oy+9, p.body); px(ox+7, oy+9, p.body); px(ox+8, oy+9, p.body); px(ox+9, oy+9, p.body); px(ox+10, oy+9, p.body); px(ox+11, oy+9, p.body); px(ox+12, oy+9, p.body); px(ox+13, oy+9, p.bodyDark); px(ox+14, oy+9, p.armor); px(ox+15, oy+9, p.outline);
            // Lower torso
            px(ox+4, oy+10, p.outline); px(ox+5, oy+10, p.bodyDark); px(ox+6, oy+10, p.bodyDark); px(ox+7, oy+10, p.body); px(ox+8, oy+10, p.body); px(ox+9, oy+10, p.body); px(ox+10, oy+10, p.body); px(ox+11, oy+10, p.body); px(ox+12, oy+10, p.bodyDark); px(ox+13, oy+10, p.bodyDark); px(ox+14, oy+10, p.outline);
            // Waist
            px(ox+5, oy+11, p.outline); px(ox+6, oy+11, p.armor); px(ox+7, oy+11, p.bodyDark); px(ox+8, oy+11, p.bodyDark); px(ox+9, oy+11, p.bodyDark); px(ox+10, oy+11, p.bodyDark); px(ox+11, oy+11, p.bodyDark); px(ox+12, oy+11, p.armor); px(ox+13, oy+11, p.outline);

            // Arms
            if (armState === 0) {
                // Arms down
                px(ox+2, oy+7, p.outline); px(ox+2, oy+8, p.body); px(ox+2, oy+9, p.body); px(ox+1, oy+10, p.claw); px(ox+1, oy+9, p.bodyDark);
                px(ox+16, oy+7, p.outline); px(ox+16, oy+8, p.body); px(ox+16, oy+9, p.body); px(ox+17, oy+10, p.claw); px(ox+17, oy+9, p.bodyDark);
            } else {
                // Arms raised for attack
                px(ox+2, oy+5, p.outline); px(ox+2, oy+6, p.body); px(ox+1, oy+4, p.bodyDark); px(ox+1, oy+3, p.claw); px(ox+1, oy+5, p.claw);
                px(ox+16, oy+5, p.outline); px(ox+16, oy+6, p.body); px(ox+17, oy+4, p.bodyDark); px(ox+17, oy+3, p.claw); px(ox+17, oy+5, p.claw);
            }

            // Legs (thick stumps)
            px(ox+6, oy+12, p.outline); px(ox+7, oy+12, p.bodyDark); px(ox+8, oy+12, p.bodyDark); px(ox+9, oy+12, p.outline);
            px(ox+10, oy+12, p.outline); px(ox+11, oy+12, p.bodyDark); px(ox+12, oy+12, p.bodyDark); px(ox+13, oy+12, p.outline);
            px(ox+5, oy+13, p.outline); px(ox+6, oy+13, p.bodyDark); px(ox+7, oy+13, p.body); px(ox+8, oy+13, p.bodyDark); px(ox+9, oy+13, p.outline);
            px(ox+10, oy+13, p.outline); px(ox+11, oy+13, p.bodyDark); px(ox+12, oy+13, p.body); px(ox+13, oy+13, p.bodyDark); px(ox+14, oy+13, p.outline);
            // Feet
            px(ox+5, oy+14, p.outline); px(ox+6, oy+14, p.outline); px(ox+7, oy+14, p.bodyDark); px(ox+8, oy+14, p.outline); px(ox+9, oy+14, p.outline);
            px(ox+10, oy+14, p.outline); px(ox+11, oy+14, p.outline); px(ox+12, oy+14, p.bodyDark); px(ox+13, oy+14, p.outline); px(ox+14, oy+14, p.outline);
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
        // Row 4: death frame 1
        drawAbom(0, FH*4, 0, false);
        // Row 4 frame 2: massive corpse puddle
        this._rect(ctx, FW+3, FH*4+10, 14, 1, p.armor);
        this._rect(ctx, FW+4, FH*4+11, 12, 2, p.bodyDark);
        this._rect(ctx, FW+5, FH*4+12, 10, 1, p.body);
        this._rect(ctx, FW+6, FH*4+13, 8, 1, p.blood);
        this._rect(ctx, FW+7, FH*4+14, 6, 1, p.blood);
        px(FW+7, FH*4+10, p.eye); px(FW+9, FH*4+10, p.eye); px(FW+11, FH*4+10, p.eye);
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

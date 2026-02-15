// ============================================
// President Devil — Runtime Pixel-Art Sprite Generator
// ============================================
// Generates player spritesheet on a canvas at startup.
// 16×16 frames, 4 directions × multiple animation states.
//
// Spritesheet layout (each frame 16×16):
//   Row 0: idle-down   (2 frames)
//   Row 1: idle-right  (2 frames)
//   Row 2: idle-up     (2 frames)
//   Row 3: idle-left   (2 frames)   — mirrored right
//   Row 4: walk-down   (4 frames)
//   Row 5: walk-right  (4 frames)
//   Row 6: walk-up     (4 frames)
//   Row 7: walk-left   (4 frames)   — mirrored right
//   Row 8: attack-down (3 frames)
//   Row 9: attack-right(3 frames)
//   Row 10: attack-up  (3 frames)
//   Row 11: attack-left(3 frames)   — mirrored right
//   Row 12: hurt       (2 frames)
//   Row 13: death      (4 frames)

const SPRITE_GEN = {
    FRAME_W: 16,
    FRAME_H: 16,
    COLS: 4,      // max frames per row
    ROWS: 14,

    // Color palette (president-like character in dark setting)
    PAL: {
        skin:       '#e8c8a0',
        skinShade:  '#c4a078',
        hair:       '#332222',
        suit:       '#2a2a3e',
        suitLight:  '#3a3a52',
        shirt:      '#d8d8e8',
        tie:        '#aa2222',
        shoes:      '#1a1a1a',
        eye:        '#222222',
        outline:    '#181820',
        blood:      '#aa1111',
    },

    generate(scene) {
        const W = this.FRAME_W * this.COLS;
        const H = this.FRAME_H * this.ROWS;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Draw each row
        this._drawIdleFrames(ctx, 0, 'down');
        this._drawIdleFrames(ctx, 1, 'right');
        this._drawIdleFrames(ctx, 2, 'up');
        this._drawIdleFrames(ctx, 3, 'left');

        this._drawWalkFrames(ctx, 4, 'down');
        this._drawWalkFrames(ctx, 5, 'right');
        this._drawWalkFrames(ctx, 6, 'up');
        this._drawWalkFrames(ctx, 7, 'left');

        this._drawAttackFrames(ctx, 8, 'down');
        this._drawAttackFrames(ctx, 9, 'right');
        this._drawAttackFrames(ctx, 10, 'up');
        this._drawAttackFrames(ctx, 11, 'left');

        this._drawHurtFrames(ctx, 12);
        this._drawDeathFrames(ctx, 13);

        // Add to Phaser texture manager
        if (scene.textures.exists('player_sprite')) {
            scene.textures.remove('player_sprite');
        }
        scene.textures.addCanvas('player_sprite', canvas);

        // Define animations
        this._defineAnimations(scene);
    },

    // ── Pixel drawing helpers ──────────────────────────

    _px(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    },

    _drawCharacter(ctx, ox, oy, dir, opts = {}) {
        const p = this.PAL;
        const px = (x, y, c) => this._px(ctx, ox + x, oy + y, c);
        const legOffset = opts.legFrame || 0;   // 0,1,2 for walk cycle
        const armOffset = opts.armSwing || 0;    // -1,0,1
        const attackArm = opts.attackArm || 0;   // 0=none, 1=swing, 2=extended
        const bodyShift = opts.bodyShift || 0;   // vertical shift

        // Draw based on direction
        if (dir === 'down') {
            this._drawFrontBody(px, p, legOffset, armOffset, attackArm, bodyShift);
        } else if (dir === 'up') {
            this._drawBackBody(px, p, legOffset, armOffset, attackArm, bodyShift);
        } else if (dir === 'right') {
            this._drawSideBody(px, p, legOffset, armOffset, attackArm, bodyShift, false);
        } else { // left
            this._drawSideBody(px, p, legOffset, armOffset, attackArm, bodyShift, true);
        }
    },

    _drawFrontBody(px, p, legFrame, armSwing, attackArm, by) {
        // Head (rows 1-5 from top, centered)
        // Hair top
        px(6, 1+by, p.hair); px(7, 1+by, p.hair); px(8, 1+by, p.hair); px(9, 1+by, p.hair);
        // Hair sides + forehead
        px(5, 2+by, p.hair); px(6, 2+by, p.hair); px(7, 2+by, p.skin); px(8, 2+by, p.skin); px(9, 2+by, p.hair); px(10, 2+by, p.hair);
        // Face with eyes
        px(5, 3+by, p.outline); px(6, 3+by, p.skin); px(7, 3+by, p.eye); px(8, 3+by, p.skin); px(9, 3+by, p.eye); px(10, 3+by, p.skin); px(11, 3+by, p.outline);
        // Mouth area
        px(6, 4+by, p.skin); px(7, 4+by, p.skin); px(8, 4+by, p.skinShade); px(9, 4+by, p.skin); px(10, 4+by, p.skin);
        // Chin
        px(7, 5+by, p.skinShade); px(8, 5+by, p.skin); px(9, 5+by, p.skinShade);

        // Neck
        px(7, 6+by, p.shirt); px(8, 6+by, p.tie); px(9, 6+by, p.shirt);

        // Torso (suit jacket)
        px(5, 7+by, p.suit); px(6, 7+by, p.suitLight); px(7, 7+by, p.shirt); px(8, 7+by, p.tie);
        px(9, 7+by, p.shirt); px(10, 7+by, p.suitLight); px(11, 7+by, p.suit);

        px(5, 8+by, p.suit); px(6, 8+by, p.suit); px(7, 8+by, p.suitLight); px(8, 8+by, p.tie);
        px(9, 8+by, p.suitLight); px(10, 8+by, p.suit); px(11, 8+by, p.suit);

        px(5, 9+by, p.suit); px(6, 9+by, p.suit); px(7, 9+by, p.suit); px(8, 9+by, p.suitLight);
        px(9, 9+by, p.suit); px(10, 9+by, p.suit); px(11, 9+by, p.suit);

        // Arms
        const leftArmX = 4;
        const rightArmX = 12;
        if (attackArm === 0) {
            // Normal/swing arms
            const la = 7 + armSwing;
            const ra = 7 - armSwing;
            px(leftArmX, la+by, p.suit); px(leftArmX, la+1+by, p.suit); px(leftArmX, la+2+by, p.skin);
            px(rightArmX, ra+by, p.suit); px(rightArmX, ra+1+by, p.suit); px(rightArmX, ra+2+by, p.skin);
        } else {
            // Attack: right arm extended down
            px(leftArmX, 7+by, p.suit); px(leftArmX, 8+by, p.suit); px(leftArmX, 9+by, p.skin);
            px(rightArmX, 7+by, p.suit); px(rightArmX, 8+by, p.suit);
            if (attackArm === 1) {
                px(rightArmX, 9+by, p.skin); px(rightArmX, 10+by, p.outline);
            } else {
                px(rightArmX, 9+by, p.skin); px(rightArmX, 10+by, p.outline); px(rightArmX, 11+by, p.outline);
            }
        }

        // Belt
        px(6, 10+by, p.outline); px(7, 10+by, p.outline); px(8, 10+by, p.outline);
        px(9, 10+by, p.outline); px(10, 10+by, p.outline);

        // Legs
        const legSpread = legFrame === 1 ? 1 : (legFrame === 2 ? -1 : 0);
        const ll = 7 + legSpread;
        const rl = 9 - legSpread;
        px(ll, 11+by, p.suit); px(ll, 12+by, p.suit); px(ll, 13+by, p.shoes);
        px(rl, 11+by, p.suit); px(rl, 12+by, p.suit); px(rl, 13+by, p.shoes);
    },

    _drawBackBody(px, p, legFrame, armSwing, attackArm, by) {
        // Hair (back of head — more hair visible)
        px(6, 1+by, p.hair); px(7, 1+by, p.hair); px(8, 1+by, p.hair); px(9, 1+by, p.hair);
        px(5, 2+by, p.hair); px(6, 2+by, p.hair); px(7, 2+by, p.hair); px(8, 2+by, p.hair); px(9, 2+by, p.hair); px(10, 2+by, p.hair);
        px(5, 3+by, p.outline); px(6, 3+by, p.hair); px(7, 3+by, p.hair); px(8, 3+by, p.hair); px(9, 3+by, p.hair); px(10, 3+by, p.hair); px(11, 3+by, p.outline);
        px(6, 4+by, p.hair); px(7, 4+by, p.hair); px(8, 4+by, p.hair); px(9, 4+by, p.hair); px(10, 4+by, p.hair);
        // Neck
        px(7, 5+by, p.skin); px(8, 5+by, p.skin); px(9, 5+by, p.skin);

        // Collar
        px(6, 6+by, p.shirt); px(7, 6+by, p.shirt); px(8, 6+by, p.shirt); px(9, 6+by, p.shirt); px(10, 6+by, p.shirt);

        // Torso back (suit)
        px(5, 7+by, p.suit); px(6, 7+by, p.suit); px(7, 7+by, p.suitLight); px(8, 7+by, p.suit);
        px(9, 7+by, p.suitLight); px(10, 7+by, p.suit); px(11, 7+by, p.suit);
        px(5, 8+by, p.suit); px(6, 8+by, p.suitLight); px(7, 8+by, p.suit); px(8, 8+by, p.suit);
        px(9, 8+by, p.suit); px(10, 8+by, p.suitLight); px(11, 8+by, p.suit);
        px(5, 9+by, p.suit); px(6, 9+by, p.suit); px(7, 9+by, p.suit); px(8, 9+by, p.suit);
        px(9, 9+by, p.suit); px(10, 9+by, p.suit); px(11, 9+by, p.suit);

        // Arms
        if (attackArm === 0) {
            const la = 7 + armSwing;
            const ra = 7 - armSwing;
            px(4, la+by, p.suit); px(4, la+1+by, p.suit); px(4, la+2+by, p.skin);
            px(12, ra+by, p.suit); px(12, ra+1+by, p.suit); px(12, ra+2+by, p.skin);
        } else {
            px(4, 7+by, p.suit); px(4, 8+by, p.suit); px(4, 9+by, p.skin);
            px(12, 7+by, p.suit); px(12, 8+by, p.suit); px(12, 9+by, p.skin);
        }

        // Belt
        px(6, 10+by, p.outline); px(7, 10+by, p.outline); px(8, 10+by, p.outline);
        px(9, 10+by, p.outline); px(10, 10+by, p.outline);

        // Legs
        const legSpread = legFrame === 1 ? 1 : (legFrame === 2 ? -1 : 0);
        px(7+legSpread, 11+by, p.suit); px(7+legSpread, 12+by, p.suit); px(7+legSpread, 13+by, p.shoes);
        px(9-legSpread, 11+by, p.suit); px(9-legSpread, 12+by, p.suit); px(9-legSpread, 13+by, p.shoes);
    },

    _drawSideBody(px, p, legFrame, armSwing, attackArm, by, flipped) {
        // Side view — facing right, flipped for left
        const fx = flipped ? (x) => 15 - x : (x) => x;

        const spx = (x, y, c) => px(fx(x), y, c);

        // Head
        spx(7, 1+by, p.hair); spx(8, 1+by, p.hair); spx(9, 1+by, p.hair);
        spx(6, 2+by, p.hair); spx(7, 2+by, p.hair); spx(8, 2+by, p.hair); spx(9, 2+by, p.skin); spx(10, 2+by, p.hair);
        spx(6, 3+by, p.outline); spx(7, 3+by, p.hair); spx(8, 3+by, p.skin); spx(9, 3+by, p.eye); spx(10, 3+by, p.skin);
        spx(7, 4+by, p.skin); spx(8, 4+by, p.skin); spx(9, 4+by, p.skinShade); spx(10, 4+by, p.skin);
        spx(7, 5+by, p.skinShade); spx(8, 5+by, p.skin); spx(9, 5+by, p.skin);

        // Neck
        spx(8, 6+by, p.shirt); spx(9, 6+by, p.shirt);

        // Torso (side view — narrower)
        spx(7, 7+by, p.suit); spx(8, 7+by, p.suitLight); spx(9, 7+by, p.shirt); spx(10, 7+by, p.suit);
        spx(7, 8+by, p.suit); spx(8, 8+by, p.suit); spx(9, 8+by, p.suitLight); spx(10, 8+by, p.suit);
        spx(7, 9+by, p.suit); spx(8, 9+by, p.suit); spx(9, 9+by, p.suit); spx(10, 9+by, p.suit);

        // Arm (front arm)
        if (attackArm === 0) {
            const armY = 7 + armSwing;
            spx(11, armY+by, p.suit); spx(11, armY+1+by, p.suit); spx(11, armY+2+by, p.skin);
        } else if (attackArm === 1) {
            spx(11, 7+by, p.suit); spx(12, 8+by, p.suit); spx(13, 9+by, p.skin);
        } else {
            spx(11, 7+by, p.suit); spx(12, 7+by, p.suit); spx(13, 7+by, p.skin); spx(14, 7+by, p.outline);
        }

        // Belt
        spx(7, 10+by, p.outline); spx(8, 10+by, p.outline); spx(9, 10+by, p.outline); spx(10, 10+by, p.outline);

        // Legs (side view — staggered for walk)
        if (legFrame === 0) {
            spx(8, 11+by, p.suit); spx(8, 12+by, p.suit); spx(8, 13+by, p.shoes);
            spx(9, 11+by, p.suit); spx(9, 12+by, p.suit); spx(9, 13+by, p.shoes);
        } else if (legFrame === 1) {
            spx(7, 11+by, p.suit); spx(7, 12+by, p.suit); spx(7, 13+by, p.shoes);
            spx(10, 11+by, p.suit); spx(10, 12+by, p.suit); spx(10, 13+by, p.shoes);
        } else if (legFrame === 2) {
            spx(9, 11+by, p.suit); spx(9, 12+by, p.suit); spx(9, 13+by, p.shoes);
            spx(8, 11+by, p.suit); spx(8, 12+by, p.suit); spx(8, 13+by, p.shoes);
        } else {
            spx(10, 11+by, p.suit); spx(10, 12+by, p.suit); spx(10, 13+by, p.shoes);
            spx(7, 11+by, p.suit); spx(7, 12+by, p.suit); spx(7, 13+by, p.shoes);
        }
    },

    // ── Frame generators ──────────────────────────────

    _drawIdleFrames(ctx, row, dir) {
        // Frame 0: standing still
        this._drawCharacter(ctx, 0, row * this.FRAME_H, dir, { legFrame: 0, armSwing: 0 });
        // Frame 1: slight breathing (body shift 1px)
        this._drawCharacter(ctx, this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 0, armSwing: 0, bodyShift: 0 });
    },

    _drawWalkFrames(ctx, row, dir) {
        // 4-frame walk cycle
        this._drawCharacter(ctx, 0 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 0, armSwing: 0 });
        this._drawCharacter(ctx, 1 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 1, armSwing: 1 });
        this._drawCharacter(ctx, 2 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 0, armSwing: 0 });
        this._drawCharacter(ctx, 3 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 2, armSwing: -1 });
    },

    _drawAttackFrames(ctx, row, dir) {
        // 3-frame attack: windup, swing, extended
        this._drawCharacter(ctx, 0 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 0, armSwing: -1, attackArm: 0 });
        this._drawCharacter(ctx, 1 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 0, armSwing: 0, attackArm: 1 });
        this._drawCharacter(ctx, 2 * this.FRAME_W, row * this.FRAME_H, dir, { legFrame: 0, armSwing: 0, attackArm: 2 });
    },

    _drawHurtFrames(ctx, row) {
        // 2-frame hurt (front-facing, recoiling)
        this._drawCharacter(ctx, 0, row * this.FRAME_H, 'down', { legFrame: 0, armSwing: 1, bodyShift: 0 });
        this._drawCharacter(ctx, this.FRAME_W, row * this.FRAME_H, 'down', { legFrame: 1, armSwing: -1, bodyShift: 1 });
    },

    _drawDeathFrames(ctx, row) {
        // 4-frame death sequence: stagger, kneel, collapse, flat
        this._drawCharacter(ctx, 0 * this.FRAME_W, row * this.FRAME_H, 'down', { legFrame: 1, armSwing: 1, bodyShift: 0 });
        this._drawCharacter(ctx, 1 * this.FRAME_W, row * this.FRAME_H, 'down', { legFrame: 2, armSwing: -1, bodyShift: 1 });
        // Frame 3: fallen (draw simpler collapsed shape)
        this._drawCollapsed(ctx, 2 * this.FRAME_W, row * this.FRAME_H);
        // Frame 4: flat on ground
        this._drawFlat(ctx, 3 * this.FRAME_W, row * this.FRAME_H);
    },

    _drawCollapsed(ctx, ox, oy) {
        const p = this.PAL;
        const px = (x, y, c) => this._px(ctx, ox + x, oy + y, c);
        // Kneeling / collapsed figure
        px(6, 5, p.hair); px(7, 5, p.hair); px(8, 5, p.hair); px(9, 5, p.hair);
        px(5, 6, p.hair); px(6, 6, p.skin); px(7, 6, p.skin); px(8, 6, p.skin); px(9, 6, p.skin); px(10, 6, p.hair);
        px(5, 7, p.suit); px(6, 7, p.suit); px(7, 7, p.shirt); px(8, 7, p.tie); px(9, 7, p.shirt); px(10, 7, p.suit); px(11, 7, p.suit);
        px(5, 8, p.suit); px(6, 8, p.suit); px(7, 8, p.suit); px(8, 8, p.suitLight); px(9, 8, p.suit); px(10, 8, p.suit);
        px(6, 9, p.suit); px(7, 9, p.suit); px(8, 9, p.suit); px(9, 9, p.suit);
        px(5, 10, p.skin); px(6, 10, p.suit); px(7, 10, p.shoes); px(8, 10, p.shoes); px(9, 10, p.suit); px(10, 10, p.skin);
    },

    _drawFlat(ctx, ox, oy) {
        const p = this.PAL;
        const px = (x, y, c) => this._px(ctx, ox + x, oy + y, c);
        // Lying flat on the ground
        px(3, 8, p.shoes); px(4, 8, p.suit); px(5, 8, p.suit); px(6, 8, p.suit);
        px(7, 8, p.suit); px(8, 8, p.shirt); px(9, 8, p.suit);
        px(10, 8, p.skin); px(11, 8, p.skin); px(12, 8, p.hair);
        px(3, 9, p.shoes); px(4, 9, p.suit); px(5, 9, p.suit); px(6, 9, p.suitLight);
        px(7, 9, p.tie); px(8, 9, p.shirt); px(9, 9, p.suit);
        px(10, 9, p.skin); px(11, 9, p.hair); px(12, 9, p.hair);
        // Blood pool
        px(6, 10, p.blood); px(7, 10, p.blood); px(8, 10, p.blood); px(9, 10, p.blood);
    },

    // ── Animation definitions ──────────────────────────

    _defineAnimations(scene) {
        const FW = this.FRAME_W;
        const FH = this.FRAME_H;
        const tex = 'player_sprite';

        // Helper: create frames from row
        const rowFrames = (row, count) => {
            const frames = [];
            for (let i = 0; i < count; i++) {
                const frameName = `r${row}_f${i}`;
                // Add frame to texture if not exists
                if (!scene.textures.getFrame(tex, frameName)) {
                    scene.textures.get(tex).add(
                        frameName,          // frame name (string key)
                        0,                  // source index
                        i * FW,             // x
                        row * FH,           // y
                        FW,                 // width
                        FH                  // height
                    );
                }
                frames.push({ key: tex, frame: frameName });
            }
            return frames;
        };

        // Remove existing anims if re-creating
        const anims = scene.anims;
        const defs = [
            { key: 'player_idle_down',   row: 0, count: 2, rate: 2,  repeat: -1 },
            { key: 'player_idle_right',  row: 1, count: 2, rate: 2,  repeat: -1 },
            { key: 'player_idle_up',     row: 2, count: 2, rate: 2,  repeat: -1 },
            { key: 'player_idle_left',   row: 3, count: 2, rate: 2,  repeat: -1 },

            { key: 'player_walk_down',   row: 4, count: 4, rate: 8,  repeat: -1 },
            { key: 'player_walk_right',  row: 5, count: 4, rate: 8,  repeat: -1 },
            { key: 'player_walk_up',     row: 6, count: 4, rate: 8,  repeat: -1 },
            { key: 'player_walk_left',   row: 7, count: 4, rate: 8,  repeat: -1 },

            { key: 'player_attack_down', row: 8,  count: 3, rate: 12, repeat: 0 },
            { key: 'player_attack_right',row: 9,  count: 3, rate: 12, repeat: 0 },
            { key: 'player_attack_up',   row: 10, count: 3, rate: 12, repeat: 0 },
            { key: 'player_attack_left', row: 11, count: 3, rate: 12, repeat: 0 },

            { key: 'player_hurt',        row: 12, count: 2, rate: 6,  repeat: 0 },
            { key: 'player_death',       row: 13, count: 4, rate: 4,  repeat: 0 },
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

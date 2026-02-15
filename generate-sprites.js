// ============================================
// Sprite PNG exporter — generates README-friendly sprite images
// Run: node generate-sprites.js
// ============================================
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SCALE = 8; // 16px × 8 = 128px display size
const ABOM_SCALE = 6; // 20px × 6 = 120px

// ── Pixel helpers ──
function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}
function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// ════════════════════════════════════════════
// PLAYER — Front-facing idle frame
// ════════════════════════════════════════════
function drawPlayer(ctx, ox, oy) {
    const p = {
        skin: '#e8c8a0', skinShade: '#c4a078', hair: '#332222',
        suit: '#2a2a3e', suitLight: '#3a3a52', shirt: '#d8d8e8',
        tie: '#aa2222', shoes: '#1a1a1a', eye: '#222222', outline: '#181820',
    };
    const s = (x, y, c) => px(ctx, ox + x, oy + y, c);

    // Hair top
    s(6,1,p.hair); s(7,1,p.hair); s(8,1,p.hair); s(9,1,p.hair);
    // Hair sides + forehead
    s(5,2,p.hair); s(6,2,p.hair); s(7,2,p.skin); s(8,2,p.skin); s(9,2,p.hair); s(10,2,p.hair);
    // Face with eyes
    s(5,3,p.outline); s(6,3,p.skin); s(7,3,p.eye); s(8,3,p.skin); s(9,3,p.eye); s(10,3,p.skin); s(11,3,p.outline);
    // Mouth area
    s(6,4,p.skin); s(7,4,p.skin); s(8,4,p.skinShade); s(9,4,p.skin); s(10,4,p.skin);
    // Chin
    s(7,5,p.skinShade); s(8,5,p.skin); s(9,5,p.skinShade);
    // Neck
    s(7,6,p.shirt); s(8,6,p.tie); s(9,6,p.shirt);
    // Torso
    s(5,7,p.suit); s(6,7,p.suitLight); s(7,7,p.shirt); s(8,7,p.tie); s(9,7,p.shirt); s(10,7,p.suitLight); s(11,7,p.suit);
    s(5,8,p.suit); s(6,8,p.suit); s(7,8,p.suitLight); s(8,8,p.tie); s(9,8,p.suitLight); s(10,8,p.suit); s(11,8,p.suit);
    s(5,9,p.suit); s(6,9,p.suit); s(7,9,p.suit); s(8,9,p.suitLight); s(9,9,p.suit); s(10,9,p.suit); s(11,9,p.suit);
    // Arms
    s(4,7,p.suit); s(4,8,p.suit); s(4,9,p.skin);
    s(12,7,p.suit); s(12,8,p.suit); s(12,9,p.skin);
    // Belt
    s(6,10,p.outline); s(7,10,p.outline); s(8,10,p.outline); s(9,10,p.outline); s(10,10,p.outline);
    // Legs
    s(7,11,p.suit); s(7,12,p.suit); s(7,13,p.shoes);
    s(9,11,p.suit); s(9,12,p.suit); s(9,13,p.shoes);
}

// ════════════════════════════════════════════
// CRAWLER — Skittering insectoid spider
// ════════════════════════════════════════════
function drawCrawler(ctx, ox, oy) {
    const p = {
        body: '#44aa44', bodyLight: '#66cc66', bodyDark: '#226622',
        eye: '#ffff00', pupil: '#111111', claw: '#22aa22',
        belly: '#88dd88', outline: '#113311', fang: '#ffffff',
    };
    const s = (x, y, c) => px(ctx, ox + x, oy + y, c);

    // Outline/shadow base
    s(6,4,p.outline); s(7,4,p.outline); s(8,4,p.outline); s(9,4,p.outline);
    // Body top
    s(5,5,p.outline); s(6,5,p.bodyDark); s(7,5,p.body); s(8,5,p.body); s(9,5,p.bodyDark); s(10,5,p.outline);
    // Body w/ highlight
    s(4,6,p.outline); s(5,6,p.bodyDark); s(6,6,p.body); s(7,6,p.bodyLight); s(8,6,p.bodyLight); s(9,6,p.body); s(10,6,p.bodyDark); s(11,6,p.outline);
    // Eyes row
    s(4,7,p.outline); s(5,7,p.body); s(6,7,p.eye); s(7,7,p.pupil); s(8,7,p.bodyLight); s(9,7,p.eye); s(10,7,p.pupil); s(11,7,p.body); s(12,7,p.outline);
    // Mouth row
    s(4,8,p.outline); s(5,8,p.body); s(6,8,p.bodyLight); s(7,8,p.belly); s(8,8,p.belly); s(9,8,p.belly); s(10,8,p.bodyLight); s(11,8,p.body); s(12,8,p.outline);
    // Lower body
    s(4,9,p.outline); s(5,9,p.bodyDark); s(6,9,p.body); s(7,9,p.belly); s(8,9,p.belly); s(9,9,p.body); s(10,9,p.bodyDark); s(11,9,p.outline);
    // Bottom edge
    s(5,10,p.outline); s(6,10,p.bodyDark); s(7,10,p.body); s(8,10,p.body); s(9,10,p.bodyDark); s(10,10,p.outline);
    // Abdomen
    s(6,11,p.outline); s(7,11,p.bodyDark); s(8,11,p.bodyDark); s(9,11,p.outline);
    // Legs
    s(3,6,p.claw); s(3,7,p.outline); s(13,6,p.claw); s(13,7,p.outline);
    s(2,7,p.claw); s(3,8,p.outline); s(13,8,p.outline); s(14,7,p.claw);
    s(2,9,p.claw); s(3,9,p.outline); s(13,9,p.outline); s(14,9,p.claw);
    s(3,10,p.claw); s(4,11,p.outline); s(11,11,p.outline); s(12,10,p.claw);
}

// ════════════════════════════════════════════
// LURKER — Hooded shadow stalker
// ════════════════════════════════════════════
function drawLurker(ctx, ox, oy) {
    const p = {
        body: '#8833bb', bodyLight: '#aa55dd', bodyDark: '#552288',
        eye: '#ff3333', hood: '#442266', outline: '#220044', inner: '#331155',
    };
    const s = (x, y, c) => px(ctx, ox + x, oy + y, c);

    // Hood peak
    s(7,1,p.outline); s(8,1,p.outline);
    s(6,2,p.outline); s(7,2,p.hood); s(8,2,p.hood); s(9,2,p.outline);
    s(5,3,p.outline); s(6,3,p.hood); s(7,3,p.inner); s(8,3,p.inner); s(9,3,p.hood); s(10,3,p.outline);
    // Face with eyes
    s(5,4,p.outline); s(6,4,p.hood); s(7,4,p.eye); s(8,4,p.inner); s(9,4,p.eye); s(10,4,p.hood); s(11,4,p.outline);
    s(5,5,p.outline); s(6,5,p.bodyDark); s(7,5,p.inner); s(8,5,p.inner); s(9,5,p.inner); s(10,5,p.bodyDark); s(11,5,p.outline);
    // Shoulders
    s(4,6,p.outline); s(5,6,p.bodyDark); s(6,6,p.body); s(7,6,p.bodyLight); s(8,6,p.bodyLight); s(9,6,p.body); s(10,6,p.bodyDark); s(11,6,p.outline);
    // Upper robe
    s(4,7,p.outline); s(5,7,p.body); s(6,7,p.bodyLight); s(7,7,p.bodyLight); s(8,7,p.bodyLight); s(9,7,p.bodyLight); s(10,7,p.body); s(11,7,p.outline);
    // Mid robe
    s(4,8,p.outline); s(5,8,p.bodyDark); s(6,8,p.body); s(7,8,p.body); s(8,8,p.body); s(9,8,p.body); s(10,8,p.bodyDark); s(11,8,p.outline);
    // Lower robe
    s(4,9,p.outline); s(5,9,p.bodyDark); s(6,9,p.bodyDark); s(7,9,p.body); s(8,9,p.body); s(9,9,p.bodyDark); s(10,9,p.bodyDark); s(11,9,p.outline);
    // Robe bottom
    s(5,10,p.outline); s(6,10,p.bodyDark); s(7,10,p.body); s(8,10,p.body); s(9,10,p.bodyDark); s(10,10,p.outline);
    // Wispy hem
    s(5,11,p.outline); s(6,11,p.bodyDark); s(7,11,p.bodyDark); s(8,11,p.bodyDark); s(9,11,p.bodyDark); s(10,11,p.outline);
    // Trailing wisps
    s(6,12,p.outline); s(7,12,p.bodyDark); s(8,12,p.bodyDark); s(9,12,p.outline);
    s(7,13,p.outline); s(8,13,p.outline);
}

// ════════════════════════════════════════════
// BRUTE — Hulking muscular tank
// ════════════════════════════════════════════
function drawBrute(ctx, ox, oy) {
    const p = {
        body: '#bb3333', bodyLight: '#dd5555', bodyDark: '#881818',
        eye: '#ffcc00', pupil: '#111111', fist: '#ffaa77',
        armor: '#553333', outline: '#220000', teeth: '#ffffff', belt: '#443322',
    };
    const s = (x, y, c) => px(ctx, ox + x, oy + y, c);

    // Head top
    s(6,1,p.outline); s(7,1,p.bodyDark); s(8,1,p.bodyDark); s(9,1,p.outline);
    // Forehead
    s(5,2,p.outline); s(6,2,p.body); s(7,2,p.bodyLight); s(8,2,p.bodyLight); s(9,2,p.body); s(10,2,p.outline);
    // Eyes
    s(5,3,p.outline); s(6,3,p.body); s(7,3,p.eye); s(8,3,p.bodyLight); s(9,3,p.eye); s(10,3,p.body); s(11,3,p.outline);
    // Jaw
    s(5,4,p.outline); s(6,4,p.bodyDark); s(7,4,p.body); s(8,4,p.body); s(9,4,p.body); s(10,4,p.bodyDark); s(11,4,p.outline);
    // Neck
    s(6,5,p.outline); s(7,5,p.body); s(8,5,p.body); s(9,5,p.body); s(10,5,p.outline);
    // Massive torso
    s(3,6,p.outline); s(4,6,p.armor); s(5,6,p.body); s(6,6,p.bodyLight); s(7,6,p.bodyLight); s(8,6,p.bodyLight); s(9,6,p.bodyLight); s(10,6,p.body); s(11,6,p.armor); s(12,6,p.outline);
    s(3,7,p.outline); s(4,7,p.armor); s(5,7,p.body); s(6,7,p.bodyLight); s(7,7,p.bodyLight); s(8,7,p.bodyLight); s(9,7,p.bodyLight); s(10,7,p.body); s(11,7,p.armor); s(12,7,p.outline);
    s(3,8,p.outline); s(4,8,p.bodyDark); s(5,8,p.body); s(6,8,p.body); s(7,8,p.bodyLight); s(8,8,p.bodyLight); s(9,8,p.body); s(10,8,p.body); s(11,8,p.bodyDark); s(12,8,p.outline);
    // Belt
    s(4,9,p.outline); s(5,9,p.belt); s(6,9,p.belt); s(7,9,p.belt); s(8,9,p.belt); s(9,9,p.belt); s(10,9,p.belt); s(11,9,p.outline);
    // Arms
    s(2,6,p.outline); s(2,7,p.body); s(2,8,p.bodyDark); s(1,8,p.fist); s(1,9,p.fist);
    s(13,6,p.outline); s(13,7,p.body); s(13,8,p.bodyDark); s(14,8,p.fist); s(14,9,p.fist);
    // Legs
    s(5,10,p.outline); s(6,10,p.bodyDark); s(7,10,p.bodyDark); s(9,10,p.bodyDark); s(10,10,p.bodyDark); s(11,10,p.outline);
    s(5,11,p.outline); s(6,11,p.body); s(7,11,p.outline); s(9,11,p.outline); s(10,11,p.body); s(11,11,p.outline);
    s(5,12,p.outline); s(6,12,p.bodyDark); s(7,12,p.outline); s(9,12,p.outline); s(10,12,p.bodyDark); s(11,12,p.outline);
}

// ════════════════════════════════════════════
// SHADE — Ghostly wraith
// ════════════════════════════════════════════
function drawShade(ctx, ox, oy) {
    const p = {
        body: '#3344aa', bodyLight: '#5566cc', bodyDark: '#222266',
        eye: '#aabbff', glow: '#8899ff', wisp: '#4455bb',
        cloak: '#1a1a44', outline: '#0a0a22',
    };
    const s = (x, y, c) => px(ctx, ox + x, oy + y, c);

    // Crown/head top
    s(7,2,p.outline); s(8,2,p.outline);
    // Ethereal head
    s(6,3,p.outline); s(7,3,p.cloak); s(8,3,p.cloak); s(9,3,p.outline);
    s(5,4,p.outline); s(6,4,p.bodyDark); s(7,4,p.bodyLight); s(8,4,p.bodyLight); s(9,4,p.bodyDark); s(10,4,p.outline);
    // Eyes
    s(5,5,p.outline); s(6,5,p.body); s(7,5,p.eye); s(8,5,p.glow); s(9,5,p.eye); s(10,5,p.body); s(11,5,p.outline);
    // Lower face
    s(6,6,p.outline); s(7,6,p.bodyDark); s(8,6,p.bodyDark); s(9,6,p.outline);
    // Wispy body
    s(5,7,p.outline); s(6,7,p.body); s(7,7,p.bodyLight); s(8,7,p.bodyLight); s(9,7,p.body); s(10,7,p.outline);
    s(4,8,p.outline); s(5,8,p.bodyDark); s(6,8,p.body); s(7,8,p.bodyLight); s(8,8,p.bodyLight); s(9,8,p.body); s(10,8,p.bodyDark); s(11,8,p.outline);
    s(4,9,p.outline); s(5,9,p.bodyDark); s(6,9,p.body); s(7,9,p.body); s(8,9,p.body); s(9,9,p.body); s(10,9,p.bodyDark); s(11,9,p.outline);
    // Lower body narrows
    s(5,10,p.outline); s(6,10,p.bodyDark); s(7,10,p.body); s(8,10,p.body); s(9,10,p.bodyDark); s(10,10,p.outline);
    // Trailing wisps
    s(4,11,p.wisp); s(6,11,p.outline); s(7,11,p.bodyDark); s(8,11,p.bodyDark); s(9,11,p.outline); s(11,11,p.wisp);
    s(3,12,p.wisp); s(7,12,p.outline); s(8,12,p.outline); s(12,12,p.wisp);
    s(5,13,p.wisp); s(10,13,p.wisp);
}

// ════════════════════════════════════════════
// ABOMINATION — Large boss monster (20×20)
// ════════════════════════════════════════════
function drawAbomination(ctx, ox, oy) {
    const p = {
        body: '#cc2222', bodyLight: '#ee4444', bodyDark: '#881111',
        eye: '#ffff00', pupil: '#000000', claw: '#ff8866',
        armor: '#661111', mouth: '#330000', outline: '#220000',
        glow: '#ff8800', teeth: '#ffffff',
    };
    const s = (x, y, c) => px(ctx, ox + x, oy + y, c);

    // Horns
    s(6,1,p.outline); s(7,1,p.bodyDark); s(12,1,p.bodyDark); s(13,1,p.outline);
    // Head
    s(6,2,p.outline); s(7,2,p.bodyDark); s(8,2,p.body); s(9,2,p.body); s(10,2,p.body); s(11,2,p.body); s(12,2,p.bodyDark); s(13,2,p.outline);
    // Upper face
    s(5,3,p.outline); s(6,3,p.body); s(7,3,p.bodyLight); s(8,3,p.bodyLight); s(9,3,p.bodyLight); s(10,3,p.bodyLight); s(11,3,p.bodyLight); s(12,3,p.body); s(13,3,p.outline);
    // Triple eyes
    s(5,4,p.outline); s(6,4,p.body); s(7,4,p.eye); s(8,4,p.bodyLight); s(9,4,p.eye); s(10,4,p.bodyLight); s(11,4,p.eye); s(12,4,p.body); s(13,4,p.outline);
    // Mouth (closed for idle)
    s(6,5,p.outline); s(7,5,p.body); s(8,5,p.body); s(9,5,p.body); s(10,5,p.body); s(11,5,p.body); s(12,5,p.body); s(13,5,p.outline);
    // Chin
    s(7,6,p.outline); s(8,6,p.bodyDark); s(9,6,p.body); s(10,6,p.body); s(11,6,p.bodyDark); s(12,6,p.outline);
    // Massive torso
    s(4,7,p.outline); s(5,7,p.armor); s(6,7,p.body); s(7,7,p.bodyLight); s(8,7,p.bodyLight); s(9,7,p.bodyLight); s(10,7,p.bodyLight); s(11,7,p.bodyLight); s(12,7,p.body); s(13,7,p.armor); s(14,7,p.outline);
    s(3,8,p.outline); s(4,8,p.armor); s(5,8,p.body); s(6,8,p.bodyLight); s(7,8,p.body); s(8,8,p.bodyLight); s(9,8,p.glow); s(10,8,p.bodyLight); s(11,8,p.body); s(12,8,p.bodyLight); s(13,8,p.body); s(14,8,p.armor); s(15,8,p.outline);
    s(3,9,p.outline); s(4,9,p.armor); s(5,9,p.bodyDark); s(6,9,p.body); s(7,9,p.body); s(8,9,p.body); s(9,9,p.body); s(10,9,p.body); s(11,9,p.body); s(12,9,p.body); s(13,9,p.bodyDark); s(14,9,p.armor); s(15,9,p.outline);
    // Lower torso
    s(4,10,p.outline); s(5,10,p.bodyDark); s(6,10,p.bodyDark); s(7,10,p.body); s(8,10,p.body); s(9,10,p.body); s(10,10,p.body); s(11,10,p.body); s(12,10,p.bodyDark); s(13,10,p.bodyDark); s(14,10,p.outline);
    // Waist
    s(5,11,p.outline); s(6,11,p.armor); s(7,11,p.bodyDark); s(8,11,p.bodyDark); s(9,11,p.bodyDark); s(10,11,p.bodyDark); s(11,11,p.bodyDark); s(12,11,p.armor); s(13,11,p.outline);
    // Arms down
    s(2,7,p.outline); s(2,8,p.body); s(2,9,p.body); s(1,10,p.claw); s(1,9,p.bodyDark);
    s(16,7,p.outline); s(16,8,p.body); s(16,9,p.body); s(17,10,p.claw); s(17,9,p.bodyDark);
    // Legs
    s(6,12,p.outline); s(7,12,p.bodyDark); s(8,12,p.bodyDark); s(9,12,p.outline);
    s(10,12,p.outline); s(11,12,p.bodyDark); s(12,12,p.bodyDark); s(13,12,p.outline);
    s(5,13,p.outline); s(6,13,p.bodyDark); s(7,13,p.body); s(8,13,p.bodyDark); s(9,13,p.outline);
    s(10,13,p.outline); s(11,13,p.bodyDark); s(12,13,p.body); s(13,13,p.bodyDark); s(14,13,p.outline);
    // Feet
    s(5,14,p.outline); s(6,14,p.outline); s(7,14,p.bodyDark); s(8,14,p.outline); s(9,14,p.outline);
    s(10,14,p.outline); s(11,14,p.outline); s(12,14,p.bodyDark); s(13,14,p.outline); s(14,14,p.outline);
}

// ── Scale-up and export ──

function exportSprite(name, frameW, frameH, drawFn, scale) {
    // Draw at native resolution
    const native = createCanvas(frameW, frameH);
    const nctx = native.getContext('2d');
    nctx.imageSmoothingEnabled = false;
    drawFn(nctx, 0, 0);

    // Scale up with nearest-neighbor
    const sw = frameW * scale;
    const sh = frameH * scale;
    const scaled = createCanvas(sw, sh);
    const sctx = scaled.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(native, 0, 0, sw, sh);

    const outDir = path.join(__dirname, 'sprites');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = path.join(outDir, `${name}.png`);
    const buf = scaled.toBuffer('image/png');
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ ${outPath} (${sw}×${sh})`);
}

console.log('Generating sprite PNGs for README...\n');

exportSprite('player',      16, 16, drawPlayer,      SCALE);
exportSprite('crawler',     16, 16, drawCrawler,      SCALE);
exportSprite('lurker',      16, 16, drawLurker,       SCALE);
exportSprite('brute',       16, 16, drawBrute,        SCALE);
exportSprite('shade',       16, 16, drawShade,        SCALE);
exportSprite('abomination', 20, 20, drawAbomination,  ABOM_SCALE);

console.log('\nDone! Sprites saved to sprites/ directory.');

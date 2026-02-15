// ============================================
// Sprite PNG exporter — generates README-friendly sprite images
// Run: node generate-sprites.js
// ============================================
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SCALE = 8; // 16px × 8 = 128px display size
const ABOM_SCALE = 6; // 20px × 6 = 120px
const ITEM_SCALE = 8; // 16px × 8 = 128px for items

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

// ── Item sprites ──
function _rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

function drawKnife(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(6,12,'#553311'); s(7,12,'#774422'); s(8,12,'#553311');
    s(6,11,'#774422'); s(7,11,'#996633'); s(8,11,'#774422');
    s(7,10,'#996633');
    s(5,9,'#555555'); s(6,9,'#777777'); s(7,9,'#888888'); s(8,9,'#777777'); s(9,9,'#555555');
    s(7,8,'#aabbcc'); s(7,7,'#bbccdd');
    s(7,6,'#ccddee'); s(8,6,'#aabbcc');
    s(7,5,'#ccddee'); s(8,5,'#99aabb');
    s(7,4,'#bbccdd'); s(7,3,'#aabbcc'); s(7,2,'#99aabb');
    s(6,5,'#ddeeff'); s(6,6,'#ddeeff'); s(6,7,'#ccddee');
}

function drawBat(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(7,14,'#222222'); s(8,14,'#333333'); s(7,13,'#333333'); s(8,13,'#222222');
    s(7,12,'#222222'); s(8,12,'#333333'); s(7,11,'#886644'); s(8,11,'#774433');
    s(6,10,'#996644'); s(7,10,'#aa7755'); s(8,10,'#996644');
    s(6,9,'#aa7755'); s(7,9,'#bb8866'); s(8,9,'#aa7755');
    s(6,8,'#aa7755'); s(7,8,'#bb8866'); s(8,8,'#aa7755'); s(9,8,'#996644');
    s(5,7,'#996644'); s(6,7,'#bb8866'); s(7,7,'#ccaa88'); s(8,7,'#bb8866'); s(9,7,'#996644');
    s(5,6,'#aa7755'); s(6,6,'#ccaa88'); s(7,6,'#ddbb99'); s(8,6,'#ccaa88'); s(9,6,'#aa7755');
    s(5,5,'#aa7755'); s(6,5,'#ccaa88'); s(7,5,'#ddbb99'); s(8,5,'#ccaa88'); s(9,5,'#aa7755');
    s(5,4,'#996644'); s(6,4,'#bb8866'); s(7,4,'#ccaa88'); s(8,4,'#bb8866'); s(9,4,'#996644');
    s(6,3,'#996644'); s(7,3,'#aa7755'); s(8,3,'#996644');
}

function drawHandgun(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(5,12,'#332222'); s(6,12,'#443333'); s(7,12,'#332222');
    s(5,11,'#443333'); s(6,11,'#554444'); s(7,11,'#443333');
    s(5,10,'#332222'); s(6,10,'#443333'); s(7,10,'#332222');
    s(4,9,'#555555'); s(5,9,'#555555'); s(6,9,'#666666'); s(7,9,'#666666'); s(8,9,'#555555');
    s(5,8,'#555555'); s(6,8,'#777777'); s(7,8,'#888888'); s(8,8,'#777777'); s(9,8,'#555555');
    s(5,7,'#666666'); s(6,7,'#888888'); s(7,7,'#999999'); s(8,7,'#888888'); s(9,7,'#666666');
    s(5,6,'#444444'); s(6,6,'#666666'); s(7,6,'#777777'); s(8,6,'#666666'); s(9,6,'#444444');
    s(6,5,'#ff4400'); s(7,5,'#666666'); s(8,5,'#555555');
    s(7,4,'#555555'); s(7,3,'#444444'); s(7,2,'#333333');
}

function drawShotgun(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(6,14,'#553311'); s(7,14,'#774422'); s(8,14,'#553311');
    s(6,13,'#774422'); s(7,13,'#886633'); s(8,13,'#774422');
    s(6,12,'#886633'); s(7,12,'#996644'); s(8,12,'#886633');
    s(6,11,'#555555'); s(7,11,'#777777'); s(8,11,'#555555');
    s(6,10,'#666666'); s(7,10,'#888888'); s(8,10,'#666666');
    s(5,9,'#774422'); s(6,9,'#886633'); s(7,9,'#996644'); s(8,9,'#886633'); s(9,9,'#774422');
    s(6,8,'#555555'); s(7,8,'#666666'); s(8,8,'#555555');
    s(6,7,'#555555'); s(7,7,'#666666'); s(8,7,'#555555');
    s(7,6,'#555555'); s(8,6,'#555555'); s(6,6,'#444444');
    s(7,5,'#555555'); s(8,5,'#444444'); s(6,7,'#444444');
    s(7,4,'#444444'); s(8,4,'#444444');
    s(7,3,'#333333'); s(8,3,'#333333');
}

function drawCrossbow(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(7,13,'#553311'); s(8,13,'#774422'); s(7,12,'#774422'); s(8,12,'#553311');
    s(7,11,'#555555'); s(8,11,'#666666'); s(7,10,'#666666'); s(8,10,'#777777');
    s(7,9,'#555555'); s(8,9,'#666666'); s(7,8,'#777777'); s(8,8,'#888888');
    s(3,7,'#774422'); s(4,7,'#886633'); s(5,7,'#886633'); s(6,7,'#886633');
    s(7,7,'#555555'); s(8,7,'#555555');
    s(9,7,'#886633'); s(10,7,'#886633'); s(11,7,'#886633'); s(12,7,'#774422');
    s(2,6,'#888888'); s(13,6,'#888888'); s(3,6,'#666666'); s(12,6,'#666666');
    s(4,8,'#aaaaaa'); s(5,8,'#aaaaaa'); s(6,8,'#aaaaaa');
    s(9,8,'#aaaaaa'); s(10,8,'#aaaaaa'); s(11,8,'#aaaaaa');
    s(7,6,'#888888'); s(7,5,'#aaaaaa'); s(7,4,'#aaaaaa'); s(7,3,'#bbbbbb');
    s(6,2,'#cccccc'); s(7,2,'#dddddd'); s(8,2,'#cccccc');
}

function drawHealthItem(ctx, ox, oy) {
    _rect(ctx, ox+4, oy+4, 8, 8, '#dddddd');
    _rect(ctx, ox+5, oy+5, 6, 6, '#eeeeee');
    _rect(ctx, ox+4, oy+4, 8, 1, '#aaaaaa'); _rect(ctx, ox+4, oy+11, 8, 1, '#aaaaaa');
    _rect(ctx, ox+4, oy+4, 1, 8, '#aaaaaa'); _rect(ctx, ox+11, oy+4, 1, 8, '#aaaaaa');
    _rect(ctx, ox+7, oy+5, 2, 6, '#cc2222');
    _rect(ctx, ox+5, oy+7, 6, 2, '#cc2222');
    px(ctx, ox+5, oy+5, '#ffffff'); px(ctx, ox+6, oy+5, '#ffffff');
}

function drawKey(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(4,3,'#ccaa22'); s(5,3,'#ccaa22'); s(6,3,'#ccaa22');
    s(3,4,'#ccaa22'); s(4,4,'#ffdd44'); s(5,4,'#ffee66'); s(6,4,'#ffdd44'); s(7,4,'#ccaa22');
    s(3,5,'#ccaa22'); s(4,5,'#ffdd44'); s(5,5,'#000000'); s(6,5,'#ffdd44'); s(7,5,'#ccaa22');
    s(3,6,'#ccaa22'); s(4,6,'#ffdd44'); s(5,6,'#ffee66'); s(6,6,'#ffdd44'); s(7,6,'#ccaa22');
    s(4,7,'#ccaa22'); s(5,7,'#ccaa22'); s(6,7,'#ccaa22');
    s(5,8,'#ddbb33'); s(6,8,'#ddbb33'); s(5,9,'#ccaa22'); s(6,9,'#ddbb33');
    s(5,10,'#ddbb33'); s(6,10,'#ccaa22'); s(5,11,'#ccaa22'); s(6,11,'#ddbb33');
    s(7,10,'#ccaa22'); s(8,10,'#ccaa22');
    s(7,12,'#ccaa22'); s(8,12,'#ccaa22'); s(5,12,'#ccaa22'); s(6,12,'#ccaa22');
}

function drawRepairKit(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    _rect(ctx, ox+3, oy+6, 10, 6, '#338833');
    _rect(ctx, ox+4, oy+7, 8, 4, '#44aa44');
    _rect(ctx, ox+3, oy+5, 10, 2, '#448844');
    s(6,4,'#666666'); s(7,4,'#888888'); s(8,4,'#888888'); s(9,4,'#666666');
    s(6,3,'#888888'); s(9,3,'#888888');
    s(7,6,'#dddd44'); s(8,6,'#dddd44');
    _rect(ctx, ox+3, oy+5, 10, 1, '#226622'); _rect(ctx, ox+3, oy+11, 10, 1, '#226622');
    _rect(ctx, ox+3, oy+5, 1, 7, '#226622'); _rect(ctx, ox+12, oy+5, 1, 7, '#226622');
    s(6,8,'#cccccc'); s(7,8,'#cccccc'); s(8,8,'#cccccc');
    s(7,9,'#cccccc');
    s(6,10,'#cccccc'); s(7,10,'#cccccc'); s(8,10,'#cccccc');
}

function drawGrenade(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(7,3,'#888888'); s(8,3,'#888888'); s(9,3,'#888888'); s(9,4,'#888888');
    s(6,3,'#666666'); s(6,4,'#666666'); s(6,5,'#666666');
    s(7,4,'#334433'); s(8,4,'#445544');
    s(6,6,'#334433'); s(7,6,'#445544'); s(8,6,'#556655'); s(9,6,'#445544');
    s(6,7,'#445544'); s(7,7,'#556655'); s(8,7,'#667766'); s(9,7,'#556655');
    s(6,8,'#556655'); s(7,8,'#667766'); s(8,8,'#778877'); s(9,8,'#667766');
    s(6,9,'#445544'); s(7,9,'#556655'); s(8,9,'#667766'); s(9,9,'#556655');
    s(6,10,'#334433'); s(7,10,'#445544'); s(8,10,'#556655'); s(9,10,'#445544');
    s(7,11,'#334433'); s(8,11,'#334433');
    s(5,7,'#334433'); s(10,7,'#334433'); s(5,9,'#334433'); s(10,9,'#334433');
}

function drawAmmoPistol(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(4,5,'#ccaa88'); s(4,6,'#cc8833'); s(4,7,'#ddaa44'); s(4,8,'#ddaa44'); s(4,9,'#ddaa44'); s(4,10,'#aa7722');
    s(7,4,'#ccaa88'); s(7,5,'#cc8833'); s(7,6,'#ddaa44'); s(7,7,'#ddaa44'); s(7,8,'#ddaa44'); s(7,9,'#aa7722');
    s(10,6,'#ccaa88'); s(10,7,'#cc8833'); s(10,8,'#ddaa44'); s(10,9,'#ddaa44'); s(10,10,'#ddaa44'); s(10,11,'#aa7722');
}

function drawAmmoShotgun(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(4,4,'#888888'); s(5,4,'#888888');
    s(4,5,'#cc3333'); s(5,5,'#dd4444'); s(4,6,'#dd4444'); s(5,6,'#ee5555');
    s(4,7,'#dd4444'); s(5,7,'#ee5555'); s(4,8,'#dd4444'); s(5,8,'#ee5555');
    s(4,9,'#cc8833'); s(5,9,'#cc8833');
    s(9,5,'#888888'); s(10,5,'#888888');
    s(9,6,'#cc3333'); s(10,6,'#dd4444'); s(9,7,'#dd4444'); s(10,7,'#ee5555');
    s(9,8,'#dd4444'); s(10,8,'#ee5555'); s(9,9,'#dd4444'); s(10,9,'#ee5555');
    s(9,10,'#cc8833'); s(10,10,'#cc8833');
}

function drawAmmoCrossbow(ctx, ox, oy) {
    const s = (x,y,c) => px(ctx,ox+x,oy+y,c);
    s(4,3,'#aaaaaa'); s(5,3,'#888888'); s(6,3,'#aaaaaa');
    s(5,4,'#777777'); s(5,5,'#777777'); s(5,6,'#777777');
    s(5,7,'#666655'); s(5,8,'#666655'); s(5,9,'#666655'); s(5,10,'#554433');
    s(4,10,'#886644'); s(6,10,'#886644');
    s(7,4,'#aaaaaa'); s(8,4,'#888888'); s(9,4,'#aaaaaa');
    s(8,5,'#777777'); s(8,6,'#777777'); s(8,7,'#777777');
    s(8,8,'#666655'); s(8,9,'#666655'); s(8,10,'#666655'); s(8,11,'#554433');
    s(7,11,'#886644'); s(9,11,'#886644');
    s(10,3,'#aaaaaa'); s(11,3,'#888888'); s(12,3,'#aaaaaa');
    s(11,4,'#777777'); s(11,5,'#777777'); s(11,6,'#777777');
    s(11,7,'#666655'); s(11,8,'#666655'); s(11,9,'#666655'); s(11,10,'#554433');
    s(10,10,'#886644'); s(12,10,'#886644');
}

console.log('\nItems:');
exportSprite('item_knife',       16, 16, drawKnife,       ITEM_SCALE);
exportSprite('item_bat',         16, 16, drawBat,         ITEM_SCALE);
exportSprite('item_handgun',     16, 16, drawHandgun,     ITEM_SCALE);
exportSprite('item_shotgun',     16, 16, drawShotgun,     ITEM_SCALE);
exportSprite('item_crossbow',    16, 16, drawCrossbow,    ITEM_SCALE);
exportSprite('item_grenade',     16, 16, drawGrenade,     ITEM_SCALE);
exportSprite('item_health',      16, 16, drawHealthItem,  ITEM_SCALE);
exportSprite('item_key',         16, 16, drawKey,         ITEM_SCALE);
exportSprite('item_repair_kit',  16, 16, drawRepairKit,   ITEM_SCALE);
exportSprite('item_ammo_pistol', 16, 16, drawAmmoPistol,  ITEM_SCALE);
exportSprite('item_ammo_shotgun',16, 16, drawAmmoShotgun, ITEM_SCALE);
exportSprite('item_ammo_crossbow',16,16, drawAmmoCrossbow,ITEM_SCALE);

// ════════════════════════════════════════════
// TILES — Walls, Floors, Doors
// ════════════════════════════════════════════
const TILE_SCALE = 8; // 16px × 8 = 128px

function drawTileWall(ctx, ox, oy) {
    // Base stone fill
    rect(ctx, ox, oy, 16, 16, '#8888aa');
    // Brick row 1
    rect(ctx, ox, oy, 16, 1, '#666680');
    rect(ctx, ox, oy+1, 7, 3, '#9999bb');
    rect(ctx, ox+8, oy+1, 8, 3, '#8888aa');
    px(ctx, ox+7, oy+1, '#666680'); px(ctx, ox+7, oy+2, '#666680'); px(ctx, ox+7, oy+3, '#666680');
    // Brick row 2
    rect(ctx, ox, oy+4, 16, 1, '#666680');
    rect(ctx, ox, oy+5, 3, 3, '#8888aa');
    rect(ctx, ox+4, oy+5, 7, 3, '#9494b4');
    rect(ctx, ox+12, oy+5, 4, 3, '#8c8cac');
    px(ctx, ox+3, oy+5, '#666680'); px(ctx, ox+3, oy+6, '#666680'); px(ctx, ox+3, oy+7, '#666680');
    px(ctx, ox+11, oy+5, '#666680'); px(ctx, ox+11, oy+6, '#666680'); px(ctx, ox+11, oy+7, '#666680');
    // Brick row 3
    rect(ctx, ox, oy+8, 16, 1, '#666680');
    rect(ctx, ox, oy+9, 7, 3, '#8c8cac');
    rect(ctx, ox+8, oy+9, 8, 3, '#9090b0');
    px(ctx, ox+7, oy+9, '#666680'); px(ctx, ox+7, oy+10, '#666680'); px(ctx, ox+7, oy+11, '#666680');
    // Brick row 4
    rect(ctx, ox, oy+12, 16, 1, '#666680');
    rect(ctx, ox, oy+13, 3, 3, '#9090b0');
    rect(ctx, ox+4, oy+13, 7, 3, '#8888aa');
    rect(ctx, ox+12, oy+13, 4, 3, '#9494b4');
    px(ctx, ox+3, oy+13, '#666680'); px(ctx, ox+3, oy+14, '#666680'); px(ctx, ox+3, oy+15, '#666680');
    px(ctx, ox+11, oy+13, '#666680'); px(ctx, ox+11, oy+14, '#666680'); px(ctx, ox+11, oy+15, '#666680');
    // Highlights
    px(ctx, ox+1, oy+1, '#a0a0c0'); px(ctx, ox+2, oy+1, '#a0a0c0');
    px(ctx, ox+9, oy+1, '#9a9abc'); px(ctx, ox+10, oy+1, '#9a9abc');
    px(ctx, ox+5, oy+5, '#a0a0c0'); px(ctx, ox+6, oy+5, '#a0a0c0');
    // Shadows
    px(ctx, ox+4, oy+3, '#7878a0'); px(ctx, ox+5, oy+3, '#7878a0');
    px(ctx, ox+12, oy+7, '#7878a0'); px(ctx, ox+13, oy+7, '#7878a0');
}

function drawTileWallRitual(ctx, ox, oy) {
    rect(ctx, ox, oy, 16, 16, '#6a2020');
    rect(ctx, ox, oy, 16, 1, '#4a1515');
    rect(ctx, ox, oy+1, 7, 3, '#8a2828');
    rect(ctx, ox+8, oy+1, 8, 3, '#7a2222');
    px(ctx, ox+7, oy+1, '#4a1515'); px(ctx, ox+7, oy+2, '#4a1515'); px(ctx, ox+7, oy+3, '#4a1515');
    rect(ctx, ox, oy+4, 16, 1, '#4a1515');
    rect(ctx, ox, oy+5, 3, 3, '#7a2222');
    rect(ctx, ox+4, oy+5, 7, 3, '#882828');
    rect(ctx, ox+12, oy+5, 4, 3, '#802525');
    px(ctx, ox+3, oy+5, '#4a1515'); px(ctx, ox+3, oy+6, '#4a1515'); px(ctx, ox+3, oy+7, '#4a1515');
    px(ctx, ox+11, oy+5, '#4a1515'); px(ctx, ox+11, oy+6, '#4a1515'); px(ctx, ox+11, oy+7, '#4a1515');
    rect(ctx, ox, oy+8, 16, 1, '#4a1515');
    rect(ctx, ox, oy+9, 7, 3, '#802525');
    rect(ctx, ox+8, oy+9, 8, 3, '#852727');
    px(ctx, ox+7, oy+9, '#4a1515'); px(ctx, ox+7, oy+10, '#4a1515'); px(ctx, ox+7, oy+11, '#4a1515');
    rect(ctx, ox, oy+12, 16, 1, '#4a1515');
    rect(ctx, ox, oy+13, 3, 3, '#852727');
    rect(ctx, ox+4, oy+13, 7, 3, '#7a2222');
    rect(ctx, ox+12, oy+13, 4, 3, '#882828');
    px(ctx, ox+3, oy+13, '#4a1515'); px(ctx, ox+3, oy+14, '#4a1515'); px(ctx, ox+3, oy+15, '#4a1515');
    px(ctx, ox+11, oy+13, '#4a1515'); px(ctx, ox+11, oy+14, '#4a1515'); px(ctx, ox+11, oy+15, '#4a1515');
    // Glowing rune accents
    px(ctx, ox+2, oy, '#cc4422'); px(ctx, ox+10, oy, '#cc4422');
    px(ctx, ox+6, oy+4, '#cc4422'); px(ctx, ox+14, oy+4, '#cc4422');
    px(ctx, ox+5, oy+6, '#dd5533'); px(ctx, ox+6, oy+6, '#ee6644');
    px(ctx, ox+5, oy+7, '#ee6644'); px(ctx, ox+6, oy+7, '#dd5533');
}

function drawTileFloorOffice(ctx, ox, oy) {
    rect(ctx, ox, oy, 16, 16, '#555578');
    rect(ctx, ox, oy, 16, 1, '#4a4a6a');
    rect(ctx, ox, oy, 1, 16, '#4a4a6a');
    rect(ctx, ox, oy+8, 16, 1, '#4a4a6a');
    rect(ctx, ox+8, oy, 1, 16, '#4a4a6a');
    rect(ctx, ox+1, oy+1, 7, 7, '#5c5c82');
    rect(ctx, ox+9, oy+1, 7, 7, '#585878');
    rect(ctx, ox+1, oy+9, 7, 7, '#585878');
    rect(ctx, ox+9, oy+9, 7, 7, '#5a5a7e');
    px(ctx, ox+3, oy+3, '#505070');
    px(ctx, ox+11, oy+5, '#505070');
    px(ctx, ox+5, oy+11, '#626286');
    px(ctx, ox+13, oy+13, '#505070');
    px(ctx, ox+1, oy+1, '#666690');
    px(ctx, ox+9, oy+9, '#666690');
}

function drawTileFloorCorridor(ctx, ox, oy) {
    rect(ctx, ox, oy, 16, 16, '#505060');
    rect(ctx, ox, oy, 6, 5, '#525268');
    rect(ctx, ox+6, oy, 5, 4, '#4c4c5c');
    rect(ctx, ox+11, oy, 5, 6, '#4e4e60');
    rect(ctx, ox, oy+5, 4, 5, '#4e4e5e');
    rect(ctx, ox+4, oy+4, 6, 5, '#545468');
    rect(ctx, ox+10, oy+6, 6, 5, '#4c4c5c');
    rect(ctx, ox, oy+10, 5, 6, '#525264');
    rect(ctx, ox+5, oy+9, 6, 7, '#4e4e60');
    rect(ctx, ox+11, oy+11, 5, 5, '#525268');
    // Cracks
    px(ctx, ox+3, oy+2, '#3a3a4a'); px(ctx, ox+4, oy+3, '#3a3a4a'); px(ctx, ox+4, oy+4, '#3a3a4a');
    px(ctx, ox+5, oy+5, '#3a3a4a'); px(ctx, ox+5, oy+6, '#3a3a4a');
    px(ctx, ox+10, oy+10, '#3a3a4a'); px(ctx, ox+11, oy+11, '#3a3a4a'); px(ctx, ox+12, oy+11, '#3a3a4a');
    px(ctx, ox+8, oy+1, '#3e3e50'); px(ctx, ox+9, oy+2, '#3e3e50');
    // Pebbles
    px(ctx, ox+1, oy+7, '#5a5a6e');
    px(ctx, ox+7, oy+3, '#5a5a6e');
    px(ctx, ox+12, oy+8, '#5a5a6e');
}

function drawTileFloorBoss(ctx, ox, oy) {
    rect(ctx, ox, oy, 16, 16, '#3a1818');
    rect(ctx, ox, oy, 16, 1, '#2a1010');
    rect(ctx, ox, oy, 1, 16, '#2a1010');
    rect(ctx, ox, oy+8, 16, 1, '#2a1010');
    rect(ctx, ox+8, oy, 1, 16, '#2a1010');
    rect(ctx, ox+1, oy+1, 7, 7, '#3e1c1c');
    rect(ctx, ox+9, oy+1, 7, 7, '#381616');
    rect(ctx, ox+1, oy+9, 7, 7, '#401e1e');
    rect(ctx, ox+9, oy+9, 7, 7, '#3c1a1a');
    // Ritual markings
    px(ctx, ox+2, oy+2, '#661818'); px(ctx, ox+3, oy+3, '#772222'); px(ctx, ox+4, oy+4, '#661818');
    px(ctx, ox+11, oy+2, '#661818'); px(ctx, ox+12, oy+3, '#772222'); px(ctx, ox+13, oy+4, '#661818');
    px(ctx, ox+2, oy+11, '#661818'); px(ctx, ox+3, oy+12, '#772222'); px(ctx, ox+4, oy+13, '#661818');
    px(ctx, ox+11, oy+11, '#661818'); px(ctx, ox+12, oy+12, '#772222'); px(ctx, ox+13, oy+13, '#661818');
    px(ctx, ox+7, oy+7, '#993333'); px(ctx, ox+8, oy+7, '#993333');
    px(ctx, ox+7, oy+8, '#993333'); px(ctx, ox+8, oy+8, '#993333');
    px(ctx, ox+5, oy+5, '#552222'); px(ctx, ox+10, oy+5, '#552222');
    px(ctx, ox+5, oy+10, '#552222'); px(ctx, ox+10, oy+10, '#552222');
    px(ctx, ox+7, oy+4, '#552222'); px(ctx, ox+8, oy+4, '#552222');
    px(ctx, ox+7, oy+11, '#552222'); px(ctx, ox+8, oy+11, '#552222');
}

function drawTileDoor(ctx, ox, oy) {
    rect(ctx, ox+1, oy, 14, 16, '#553311');
    rect(ctx, ox+2, oy+1, 12, 14, '#886633');
    rect(ctx, ox+2, oy+3, 12, 1, '#775522');
    rect(ctx, ox+2, oy+7, 12, 1, '#775522');
    rect(ctx, ox+2, oy+11, 12, 1, '#775522');
    rect(ctx, ox+2, oy+1, 5, 5, '#997744');
    rect(ctx, ox+9, oy+1, 5, 5, '#8a6633');
    rect(ctx, ox+2, oy+8, 5, 6, '#8a6633');
    rect(ctx, ox+9, oy+8, 5, 6, '#997744');
    rect(ctx, ox+7, oy+1, 2, 14, '#664422');
    rect(ctx, ox+2, oy+6, 12, 2, '#664422');
    px(ctx, ox+11, oy+8, '#ccaa44'); px(ctx, ox+12, oy+8, '#ddbb55');
    px(ctx, ox+11, oy+9, '#bbaa33'); px(ctx, ox+12, oy+9, '#ccaa44');
    rect(ctx, ox+1, oy, 14, 1, '#442211');
    rect(ctx, ox+1, oy+15, 14, 1, '#442211');
    rect(ctx, ox+1, oy, 1, 16, '#442211');
    rect(ctx, ox+14, oy, 1, 16, '#442211');
    px(ctx, ox+3, oy+2, '#aa8855'); px(ctx, ox+10, oy+2, '#aa8855');
}

function drawTileDoorLocked(ctx, ox, oy) {
    rect(ctx, ox, oy, 16, 16, '#333344');
    rect(ctx, ox+1, oy+1, 14, 14, '#555566');
    rect(ctx, ox+2, oy+2, 12, 12, '#606070');
    px(ctx, ox+2, oy+2, '#888899'); px(ctx, ox+13, oy+2, '#888899');
    px(ctx, ox+2, oy+13, '#888899'); px(ctx, ox+13, oy+13, '#888899');
    px(ctx, ox+7, oy+2, '#888899'); px(ctx, ox+8, oy+2, '#888899');
    px(ctx, ox+7, oy+13, '#888899'); px(ctx, ox+8, oy+13, '#888899');
    rect(ctx, ox+2, oy+7, 12, 2, '#4a4a5a');
    rect(ctx, ox+7, oy+2, 2, 12, '#4a4a5a');
    rect(ctx, ox+6, oy+8, 4, 5, '#bbaa33');
    rect(ctx, ox+7, oy+8, 2, 5, '#ddcc44');
    px(ctx, ox+7, oy+9, '#222233'); px(ctx, ox+8, oy+9, '#222233');
    px(ctx, ox+7, oy+10, '#333344'); px(ctx, ox+8, oy+10, '#333344');
    px(ctx, ox+8, oy+11, '#222233');
    rect(ctx, ox, oy, 16, 1, '#222233');
    rect(ctx, ox, oy+15, 16, 1, '#222233');
    rect(ctx, ox, oy, 1, 16, '#222233');
    rect(ctx, ox+15, oy, 1, 16, '#222233');
}

function drawTileDoorSealed(ctx, ox, oy) {
    rect(ctx, ox, oy, 16, 16, '#880000');
    rect(ctx, ox+1, oy+1, 14, 14, '#aa1111');
    rect(ctx, ox+2, oy+2, 12, 12, '#cc2222');
    rect(ctx, ox+3, oy+3, 10, 10, '#dd3333');
    rect(ctx, ox+4, oy+4, 8, 8, '#cc2222');
    rect(ctx, ox+5, oy+5, 6, 6, '#aa1111');
    // X pattern
    px(ctx, ox+2, oy+2, '#ff4444'); px(ctx, ox+3, oy+3, '#ff5555'); px(ctx, ox+4, oy+4, '#ff4444');
    px(ctx, ox+5, oy+5, '#ff5555'); px(ctx, ox+6, oy+6, '#ff6666'); px(ctx, ox+7, oy+7, '#ff7777');
    px(ctx, ox+8, oy+8, '#ff7777'); px(ctx, ox+9, oy+9, '#ff6666'); px(ctx, ox+10, oy+10, '#ff5555');
    px(ctx, ox+11, oy+11, '#ff4444'); px(ctx, ox+12, oy+12, '#ff5555'); px(ctx, ox+13, oy+13, '#ff4444');
    px(ctx, ox+13, oy+2, '#ff4444'); px(ctx, ox+12, oy+3, '#ff5555'); px(ctx, ox+11, oy+4, '#ff4444');
    px(ctx, ox+10, oy+5, '#ff5555'); px(ctx, ox+9, oy+6, '#ff6666'); px(ctx, ox+8, oy+7, '#ff7777');
    px(ctx, ox+7, oy+8, '#ff7777'); px(ctx, ox+6, oy+9, '#ff6666'); px(ctx, ox+5, oy+10, '#ff5555');
    px(ctx, ox+4, oy+11, '#ff4444'); px(ctx, ox+3, oy+12, '#ff5555'); px(ctx, ox+2, oy+13, '#ff4444');
    // Bright center
    px(ctx, ox+7, oy+7, '#ffaaaa'); px(ctx, ox+8, oy+7, '#ffaaaa');
    px(ctx, ox+7, oy+8, '#ffaaaa'); px(ctx, ox+8, oy+8, '#ffaaaa');
    rect(ctx, ox, oy, 16, 1, '#550000');
    rect(ctx, ox, oy+15, 16, 1, '#550000');
    rect(ctx, ox, oy, 1, 16, '#550000');
    rect(ctx, ox+15, oy, 1, 16, '#550000');
}

console.log('\nTiles:');
exportSprite('tile_wall',           16, 16, drawTileWall,          TILE_SCALE);
exportSprite('tile_wall_ritual',    16, 16, drawTileWallRitual,    TILE_SCALE);
exportSprite('tile_floor_office',   16, 16, drawTileFloorOffice,   TILE_SCALE);
exportSprite('tile_floor_corridor', 16, 16, drawTileFloorCorridor, TILE_SCALE);
exportSprite('tile_floor_boss',     16, 16, drawTileFloorBoss,     TILE_SCALE);
exportSprite('tile_door',           16, 16, drawTileDoor,          TILE_SCALE);
exportSprite('tile_door_locked',    16, 16, drawTileDoorLocked,    TILE_SCALE);
exportSprite('tile_door_sealed',    16, 16, drawTileDoorSealed,    TILE_SCALE);

console.log('\nDone! Sprites saved to sprites/ directory.');

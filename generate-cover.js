// ============================================
// Generate 64x64 pixel art cover based on REFERENCE2.png
// Run: node generate-cover.js
// ============================================
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 64;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext('2d');

// ── Helpers ──
function px(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}
function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}
// Horizontal line of pixels
function hline(x, y, len, color) {
    rect(x, y, len, 1, color);
}
// Vertical line of pixels
function vline(x, y, len, color) {
    rect(x, y, 1, len, color);
}

// ── Color Palette ──
const C = {
    black: '#111111',
    border: '#d4b070',     // cream/gold border
    bgRed: '#cc2222',      // main red background
    darkRed: '#881818',    // darker red bg
    deepRed: '#661414',    // deepest red
    brightRed: '#ee3333',  // bright accents
    // Devil
    dSkin: '#c8b8a0',      // pale devil skin
    dSkinShade: '#a89878',
    dHorn: '#332211',      // dark horns
    dHornLight: '#554433',
    dEye: '#ff2200',       // red glowing eyes
    dEyeGlow: '#ff6644',
    dTeeth: '#f0e8d0',     // yellowish teeth
    dGums: '#881133',      // gum/mouth interior
    dSuit: '#1a1a30',      // dark navy suit
    dSuitLight: '#2a2a44',
    dClaw: '#998866',      // claw color
    dClawTip: '#444433',
    // Person (protagonist)
    pSkin: '#e8c8a0',
    pSkinShade: '#c4a078',
    pHair: '#222222',
    pSuit: '#2a2a3e',
    pSuitLight: '#3a3a52',
    pShirt: '#d0d0e0',
    pTie: '#cc2222',
    pEye: '#222222',
    // Decorations
    star: '#f0e8c0',
    bat: '#222222',
    blue: '#1a2a5e',
    blueLight: '#2a3a6e',
    white: '#f0f0f0',
    stripeRed: '#bb2222',
    stripeWhite: '#e8e0d0',
};

// ════════════════════════════════════════════
// BACKGROUND
// ════════════════════════════════════════════

// Black outer border
rect(0, 0, 64, 64, C.black);

// Cream/gold inner border
rect(2, 2, 60, 60, C.border);

// Red background fill
rect(4, 4, 56, 56, C.bgRed);

// Darker red gradient at edges
rect(4, 4, 3, 56, C.darkRed);
rect(57, 4, 3, 56, C.darkRed);

// ════════════════════════════════════════════
// TITLE: "PRSIDEN'EVIL" at top
// ════════════════════════════════════════════
// Darkened strip behind title
rect(4, 4, 56, 9, C.darkRed);

// Pixel text: "PRESIDENT DEVIL"
// Each letter ~3px wide + 1px gap, 5px tall, starting at y=5
const textY = 5;
const textC = C.white;

// P (x=5)
hline(5, textY, 3, textC); px(5, textY+1, textC); px(7, textY+1, textC);
hline(5, textY+2, 3, textC); px(5, textY+3, textC);
px(5, textY+4, textC);

// R (x=9)
hline(9, textY, 3, textC); px(9, textY+1, textC); px(11, textY+1, textC);
hline(9, textY+2, 3, textC); px(9, textY+3, textC); px(11, textY+3, textC);
px(9, textY+4, textC); px(11, textY+4, textC);

// E (x=13)
hline(13, textY, 3, textC); px(13, textY+1, textC);
hline(13, textY+2, 3, textC); px(13, textY+3, textC);
hline(13, textY+4, 3, textC);

// S (x=17)
hline(17, textY, 3, textC); px(17, textY+1, textC);
hline(17, textY+2, 3, textC); px(19, textY+3, textC);
hline(17, textY+4, 3, textC);

// I (x=21)
hline(21, textY, 3, textC); px(22, textY+1, textC);
px(22, textY+2, textC); px(22, textY+3, textC);
hline(21, textY+4, 3, textC);

// D (x=25)
hline(25, textY, 2, textC); px(25, textY+1, textC); px(27, textY+1, textC);
px(25, textY+2, textC); px(27, textY+2, textC);
px(25, textY+3, textC); px(27, textY+3, textC);
hline(25, textY+4, 2, textC); px(27, textY+4, textC);

// E (x=29)
hline(29, textY, 3, textC); px(29, textY+1, textC);
hline(29, textY+2, 3, textC); px(29, textY+3, textC);
hline(29, textY+4, 3, textC);

// N (x=33)
px(33, textY, textC); px(35, textY, textC);
px(33, textY+1, textC); px(34, textY+1, textC); px(35, textY+1, textC);
px(33, textY+2, textC); px(35, textY+2, textC);
px(33, textY+3, textC); px(35, textY+3, textC);
px(33, textY+4, textC); px(35, textY+4, textC);

// T (x=37)
hline(37, textY, 3, textC); px(38, textY+1, textC);
px(38, textY+2, textC); px(38, textY+3, textC);
px(38, textY+4, textC);

// (gap for space at x=41)

// D (x=42)
hline(42, textY, 2, textC); px(42, textY+1, textC); px(44, textY+1, textC);
px(42, textY+2, textC); px(44, textY+2, textC);
px(42, textY+3, textC); px(44, textY+3, textC);
hline(42, textY+4, 2, textC); px(44, textY+4, textC);

// E (x=46)
hline(46, textY, 3, textC); px(46, textY+1, textC);
hline(46, textY+2, 3, textC); px(46, textY+3, textC);
hline(46, textY+4, 3, textC);

// V (x=50)
px(50, textY, textC); px(52, textY, textC);
px(50, textY+1, textC); px(52, textY+1, textC);
px(50, textY+2, textC); px(52, textY+2, textC);
px(50, textY+3, textC); px(52, textY+3, textC);
px(51, textY+4, textC);

// I (x=54)
hline(54, textY, 3, textC); px(55, textY+1, textC);
px(55, textY+2, textC); px(55, textY+3, textC);
hline(54, textY+4, 3, textC);

// L (x=58)
px(58, textY, textC); px(58, textY+1, textC);
px(58, textY+2, textC); px(58, textY+3, textC);
hline(58, textY+4, 2, textC);


// ════════════════════════════════════════════
// STARS scattered in red background
// ════════════════════════════════════════════
function drawStar(sx, sy) {
    px(sx, sy-1, C.star);
    hline(sx-1, sy, 3, C.star);
    px(sx, sy+1, C.star);
}
drawStar(10, 14);
drawStar(53, 14);
drawStar(8, 20);
drawStar(55, 19);
drawStar(6, 30);
drawStar(57, 30);

// ════════════════════════════════════════════
// BATS in the background
// ════════════════════════════════════════════
function drawBat(bx, by) {
    px(bx, by, C.bat);
    px(bx-1, by-1, C.bat); px(bx+1, by-1, C.bat);
    px(bx-2, by, C.bat); px(bx+2, by, C.bat);
}
drawBat(12, 17);
drawBat(51, 16);
drawBat(9, 24);
drawBat(54, 23);
drawBat(14, 12);
drawBat(49, 13);

// ════════════════════════════════════════════
// DEVIL CHARACTER (behind, larger, top portion)
// ════════════════════════════════════════════

// --- Devil Horns ---
// Left horn
px(24, 13, C.dHorn); px(23, 12, C.dHorn);
px(24, 14, C.dHornLight);
// Right horn
px(39, 13, C.dHorn); px(40, 12, C.dHorn);
px(39, 14, C.dHornLight);

// --- Devil Hair ---
rect(25, 14, 14, 2, C.pHair);
hline(24, 15, 16, C.pHair);
hline(23, 16, 18, C.pHair);
// Hair swooped to side
px(22, 15, C.pHair); px(23, 15, C.pHair);

// --- Devil Face ---
// Forehead
hline(24, 17, 16, C.dSkin);
hline(23, 18, 18, C.dSkin);
// Eyes row - red glowing eyes
hline(23, 19, 18, C.dSkin);
px(27, 19, C.dEye); px(28, 19, C.dEye);
px(35, 19, C.dEye); px(36, 19, C.dEye);
// Glow around eyes
px(26, 19, C.dEyeGlow); px(29, 19, C.dEyeGlow);
px(34, 19, C.dEyeGlow); px(37, 19, C.dEyeGlow);
// Nose area
hline(24, 20, 16, C.dSkin);
px(31, 20, C.dSkinShade); px(32, 20, C.dSkinShade);
// Cheeks
hline(23, 21, 18, C.dSkin);
px(23, 21, C.dSkinShade); px(40, 21, C.dSkinShade);

// --- Devil Mouth / Fangs ---
// Wide grinning mouth
hline(25, 22, 14, C.dGums);
// Teeth - alternating teeth and gaps for jagged look
px(25, 22, C.dTeeth); px(27, 22, C.dTeeth); px(29, 22, C.dTeeth);
px(31, 22, C.dTeeth); px(33, 22, C.dTeeth); px(35, 22, C.dTeeth);
px(37, 22, C.dTeeth); px(38, 22, C.dTeeth);
// Lower jaw
hline(26, 23, 12, C.dGums);
px(26, 23, C.dTeeth); px(28, 23, C.dTeeth); px(30, 23, C.dTeeth);
px(33, 23, C.dTeeth); px(35, 23, C.dTeeth); px(37, 23, C.dTeeth);
// Chin
hline(27, 24, 10, C.dSkinShade);
hline(28, 25, 8, C.dSkinShade);

// --- Devil Suit / Shoulders (wide, imposing) ---
// Neck
rect(30, 25, 4, 1, C.dSkin);
// Collar
hline(28, 26, 8, C.dSuitLight);
// Shoulders - wide and imposing
hline(15, 27, 34, C.dSuit);
hline(13, 28, 38, C.dSuit);
hline(12, 29, 40, C.dSuit);
hline(11, 30, 42, C.dSuit);
hline(11, 31, 42, C.dSuit);
// Suit lapels
px(29, 27, C.dSuitLight); px(34, 27, C.dSuitLight);
px(28, 28, C.dSuitLight); px(35, 28, C.dSuitLight);

// --- Devil Arms/Claws reaching around from sides ---
// Left arm reaching down
rect(11, 32, 3, 8, C.dSuit);
rect(10, 33, 2, 7, C.dSuit);
// Left hand/claws
px(10, 40, C.dSkin); px(11, 40, C.dSkin); px(12, 40, C.dSkin);
px(10, 41, C.dClaw); px(11, 41, C.dSkin); px(12, 41, C.dClaw);
px(10, 42, C.dClawTip); px(12, 42, C.dClawTip);
// Left claw fingers reaching toward person
px(13, 41, C.dClaw); px(14, 42, C.dClawTip);
px(15, 40, C.dClaw); px(16, 41, C.dClawTip);

// Right arm reaching down
rect(50, 32, 3, 8, C.dSuit);
rect(52, 33, 2, 7, C.dSuit);
// Right hand/claws
px(51, 40, C.dSkin); px(52, 40, C.dSkin); px(53, 40, C.dSkin);
px(51, 41, C.dClaw); px(52, 41, C.dSkin); px(53, 41, C.dClaw);
px(51, 42, C.dClawTip); px(53, 42, C.dClawTip);
// Right claw fingers reaching toward person
px(50, 41, C.dClaw); px(49, 42, C.dClawTip);
px(48, 40, C.dClaw); px(47, 41, C.dClawTip);

// ════════════════════════════════════════════
// PROTAGONIST (front, smaller, scared person)
// ════════════════════════════════════════════

// --- Person Hair ---
hline(28, 30, 8, C.pHair);
hline(27, 31, 10, C.pHair);
hline(26, 32, 12, C.pHair);
// Bob cut sides
px(26, 33, C.pHair); px(37, 33, C.pHair);
px(26, 34, C.pHair); px(37, 34, C.pHair);

// --- Person Face ---
hline(27, 33, 10, C.pSkin);
hline(27, 34, 10, C.pSkin);
hline(27, 35, 10, C.pSkin);
hline(28, 36, 8, C.pSkin);
// Eyes (wide, scared)
px(29, 33, C.pEye); px(30, 33, C.pEye);
px(33, 33, C.pEye); px(34, 33, C.pEye);
// Whites of eyes (scared wide open)
px(28, 33, C.white); px(31, 33, C.white);
px(32, 33, C.white); px(35, 33, C.white);
// Eyebrows (worried, angled)
px(28, 32, C.pHair); px(35, 32, C.pHair);
// Open Mouth (scared)
hline(30, 35, 4, C.darkRed);
px(31, 36, C.darkRed); px(32, 36, C.darkRed);
// Nose
px(31, 34, C.pSkinShade); px(32, 34, C.pSkinShade);
// Chin
hline(29, 37, 6, C.pSkinShade);

// --- Person Neck ---
px(31, 38, C.pShirt); px(32, 38, C.pShirt);

// --- Person Suit ---
// Collar / shirt
hline(29, 38, 6, C.pShirt);
px(31, 38, C.pTie); px(32, 38, C.pTie);
// Torso
hline(25, 39, 14, C.pSuit);
hline(24, 40, 16, C.pSuit);
hline(23, 41, 18, C.pSuit);
hline(22, 42, 20, C.pSuit);
hline(22, 43, 20, C.pSuit);
hline(22, 44, 20, C.pSuit);
hline(23, 45, 18, C.pSuit);
hline(24, 46, 16, C.pSuit);
// Shirt/tie stripe down center
vline(31, 39, 7, C.pShirt);
vline(32, 39, 7, C.pShirt);
// Red tie
vline(31, 39, 6, C.pTie);
px(31, 45, C.pTie); // tie point
// Suit lapels
vline(29, 39, 5, C.pSuitLight);
vline(34, 39, 5, C.pSuitLight);

// --- Person's hands gripping (desk/podium) ---
// Desk/surface
hline(19, 47, 26, '#554433');
hline(19, 48, 26, '#443322');
// Left fist
px(24, 46, C.pSkin); px(25, 46, C.pSkin);
px(24, 47, C.pSkin); px(25, 47, C.pSkin);
px(24, 45, C.pSkinShade);
// Right fist
px(38, 46, C.pSkin); px(39, 46, C.pSkin);
px(38, 47, C.pSkin); px(39, 47, C.pSkin);
px(39, 45, C.pSkinShade);

// ════════════════════════════════════════════
// BOTTOM DECORATION - Stars & Stripes
// ════════════════════════════════════════════

// Blue field with stars (bottom left corner area)
rect(4, 50, 12, 8, C.blue);
px(6, 51, C.star); px(10, 51, C.star); px(14, 51, C.star);
px(8, 53, C.star); px(12, 53, C.star);
px(6, 55, C.star); px(10, 55, C.star); px(14, 55, C.star);

// Red and white stripes
for (let sy = 50; sy < 58; sy++) {
    const stripeColor = (sy % 2 === 0) ? C.stripeRed : C.stripeWhite;
    hline(16, sy, 44, stripeColor);
}

// Blue field on right too (symmetry)
rect(48, 50, 12, 8, C.blue);
px(50, 51, C.star); px(54, 51, C.star);
px(52, 53, C.star); px(56, 53, C.star);
px(50, 55, C.star); px(54, 55, C.star);

// ════════════════════════════════════════════
// SAVE
// ════════════════════════════════════════════

// Save at 1x (64x64)
const outPath = path.join(__dirname, 'sprites', 'cover_pixel.png');
const buf = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buf);
console.log(`✓ Saved 64×64 pixel cover → ${outPath}`);

// Also save a scaled-up version (8x = 512x512) for visibility
const UPSCALE = 8;
const bigCanvas = createCanvas(SIZE * UPSCALE, SIZE * UPSCALE);
const bigCtx = bigCanvas.getContext('2d');
bigCtx.imageSmoothingEnabled = false;
bigCtx.drawImage(canvas, 0, 0, SIZE * UPSCALE, SIZE * UPSCALE);
const bigPath = path.join(__dirname, 'sprites', 'cover_pixel_512.png');
fs.writeFileSync(bigPath, bigCanvas.toBuffer('image/png'));
console.log(`✓ Saved 512×512 upscaled cover → ${bigPath}`);

/**
 * Generates a placeholder hero spritesheet — 128×288 px, 32×32 frames.
 * 4 columns × 9 rows = 36 frames.
 *
 * Row 0: idle   down/up/left/right          (frames  0–3)
 * Row 1: walk   down  frames 0-3            (frames  4–7)
 * Row 2: walk   up    frames 0-3            (frames  8–11)
 * Row 3: walk   left  frames 0-3            (frames 12–15)
 * Row 4: walk   right frames 0-3            (frames 16–19)
 * Row 5: sword  down  frames 0-3            (frames 20–23)
 * Row 6: sword  up    frames 0-3            (frames 24–27)
 * Row 7: sword  left  frames 0-3            (frames 28–31)
 * Row 8: sword  right frames 0-3            (frames 32–35)
 *
 * Run: node scripts/gen-hero-spritesheet.mjs
 */

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../assets/sprites/hero.png');

const TILE = 32;
const COLS = 4;
const ROWS = 9;
const W = COLS * TILE; // 128
const H = ROWS * TILE; // 288

// Body colour per direction (tunic/clothing color)
const DIR_COLORS = {
  down:  [70,  130, 220, 255],  // blue
  up:    [220, 100, 70,  255],  // red
  left:  [70,  190, 100, 255],  // green
  right: [200, 160, 50,  255],  // gold
};

// Skin tone for head/face
const SKIN = [215, 178, 138];
// Dark hair color
const HAIR = [80, 50, 20];

const ROW_META = [
  { dir: 'down',  type: 'idle'  },
  { dir: 'down',  type: 'walk'  },
  { dir: 'up',    type: 'walk'  },
  { dir: 'left',  type: 'walk'  },
  { dir: 'right', type: 'walk'  },
  { dir: 'down',  type: 'sword' },
  { dir: 'up',    type: 'sword' },
  { dir: 'left',  type: 'sword' },
  { dir: 'right', type: 'sword' },
];

// For row 0 (idle), each column is a different direction
const IDLE_COL_DIRS = ['down', 'up', 'left', 'right'];

const pixels = Buffer.alloc(W * H * 4);

function setPixel(x, y, r, g, b, a) {
  const i = (y * W + x) * 4;
  pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
}

// Sword swing angles (degrees) per direction × 4 frames
// 0° = right, 90° = down, 180° = left, 270° = up
const SWORD_SWING = {
  down:  [-40, 10, 55, 100],   // upper-right → downward sweep
  up:    [140, 170, 220, 260], // lower-left  → upward sweep
  left:  [50,  100, 145, 180], // upper area  → leftward sweep
  right: [230, 280, 325, 360], // lower area  → rightward sweep
};

function drawSword(ox, oy, dir, frameIndex) {
  const cx = TILE / 2;
  const cy = 17; // anchor near hands (slightly below body centre)
  const a  = SWORD_SWING[dir][frameIndex] * Math.PI / 180;

  // Handle — brown, 3 px
  for (let d = 3; d <= 6; d++) {
    const sx = Math.round(cx + Math.cos(a) * d);
    const sy = Math.round(cy + Math.sin(a) * d);
    if (sx > 0 && sx < TILE-1 && sy > 0 && sy < TILE-1)
      setPixel(ox+sx, oy+sy, 139, 90, 43, 255);
  }

  // Blade — silver gradient, 10 px long, 2 px wide
  for (let d = 6; d <= 16; d++) {
    const sx = Math.round(cx + Math.cos(a) * d);
    const sy = Math.round(cy + Math.sin(a) * d);
    const v  = 150 + Math.round((d - 6) / 10 * 90);
    for (let pw = 0; pw <= 1; pw++) {
      const fx = sx + Math.round(-Math.sin(a) * pw);
      const fy = sy + Math.round( Math.cos(a) * pw);
      if (fx > 0 && fx < TILE-1 && fy > 0 && fy < TILE-1)
        setPixel(ox+fx, oy+fy, v, v, v, 255);
    }
  }
}

// Leg Y-ranges [top, bottom] per walk frame for left and right legs
// Frame alternates: neutral → left-forward → neutral → right-forward
const WALK_LEGS = [
  { L: [21, 28], R: [21, 28] }, // frame 0: neutral
  { L: [19, 26], R: [23, 28] }, // frame 1: left forward
  { L: [21, 28], R: [21, 28] }, // frame 2: neutral
  { L: [23, 28], R: [19, 26] }, // frame 3: right forward
];

function drawFrame(col, row, color, dir, frameIndex, type) {
  const ox = col * TILE;
  const oy = row * TILE;
  const [r, g, b] = color;

  const legs = (type === 'walk') ? WALK_LEGS[frameIndex % 4] : WALK_LEGS[0];

  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const border = px === 0 || py === 0 || px === TILE-1 || py === TILE-1;
      if (border) {
        setPixel(ox+px, oy+py, 0, 0, 0, 0); // transparent border — no box artifact
        continue;
      }

      const cx = 16;

      // Head: small circle at top, skin-toned. Center py=8 closes the neck gap to shoulders.
      const inHead = (px-cx)**2 + (py-8)**2 <= 22; // radius ~4.7

      // Hair: top arc of head circle (above center of head)
      const inHair = inHead && py <= 7;

      // Neck: 2-pixel tall connector between head bottom (~py=12) and shoulders (py=13)
      const inNeck = px >= 14 && px <= 18 && py >= 12 && py <= 13;

      // Shoulders: wide bar at collar
      const inShoulders = px >= 8 && px <= 24 && py >= 13 && py <= 14;

      // Torso
      const inTorso = px >= 11 && px <= 21 && py >= 14 && py <= 20;

      // Arms (sides of torso, slightly shorter at bottom)
      const inLeftArm  = px >= 8  && px <= 10 && py >= 14 && py <= 19;
      const inRightArm = px >= 22 && px <= 24 && py >= 14 && py <= 19;

      // Legs: two separate columns
      const inLeftLeg  = px >= 11 && px <= 14 && py >= legs.L[0] && py <= legs.L[1];
      const inRightLeg = px >= 18 && px <= 21 && py >= legs.R[0] && py <= legs.R[1];

      if (inHair) {
        setPixel(ox+px, oy+py, HAIR[0], HAIR[1], HAIR[2], 255);
      } else if (inHead) {
        setPixel(ox+px, oy+py, SKIN[0], SKIN[1], SKIN[2], 255);
      } else if (inNeck || inShoulders || inTorso || inLeftArm || inRightArm || inLeftLeg || inRightLeg) {
        setPixel(ox+px, oy+py, r, g, b, 255);
      } else {
        setPixel(ox+px, oy+py, 0, 0, 0, 0); // transparent
      }
    }
  }

  // Direction-aware sword drawn on top for sword-type frames
  if (type === 'sword') {
    drawSword(ox, oy, dir, frameIndex);
  }
}

// Draw all frames
for (let row = 0; row < ROWS; row++) {
  const meta = ROW_META[row];
  for (let col = 0; col < COLS; col++) {
    let dir = meta.dir;
    if (row === 0) dir = IDLE_COL_DIRS[col]; // row 0: each col = different dir
    const color = DIR_COLORS[dir];
    drawFrame(col, row, color, dir, col, meta.type);
  }
}

// ─── PNG encoder ─────────────────────────────────────────────────────────────

function u32be(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) { c ^= byte; for (let k=0; k<8; k++) c = (c&1)?(0xedb88320^(c>>>1)):(c>>>1); }
  return (c^0xffffffff)>>>0;
}
function chunk(type, data) {
  const t = Buffer.from(type,'ascii');
  const ci = Buffer.concat([t,data]);
  return Buffer.concat([u32be(data.length),t,data,u32be(crc32(ci))]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4);
ihdr[8]=8; ihdr[9]=6; ihdr[10]=ihdr[11]=ihdr[12]=0;

const raw = Buffer.alloc(H*(1+W*4));
for (let y=0; y<H; y++) {
  raw[y*(1+W*4)]=0;
  pixels.copy(raw, y*(1+W*4)+1, y*W*4, (y+1)*W*4);
}

const png = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level:6 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log('Written:', OUT);

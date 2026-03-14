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

// Body colour per direction
const DIR_COLORS = {
  down:  [70,  130, 220, 255],  // blue
  up:    [220, 100, 70,  255],  // red
  left:  [70,  190, 100, 255],  // green
  right: [200, 160, 50,  255],  // gold
};

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

function drawFrame(col, row, color, frameIndex, type) {
  const ox = col * TILE;
  const oy = row * TILE;
  const [r, g, b] = color;

  for (let py = 0; py < TILE; py++) {
    for (let px = 0; px < TILE; px++) {
      const border = px === 0 || py === 0 || px === TILE-1 || py === TILE-1;
      if (border) {
        setPixel(ox+px, oy+py, 0, 0, 0, 255);
        continue;
      }
      // Simple stick-figure silhouette: head (circle) + body rectangle
      const cx = TILE / 2, cy = TILE / 2;
      const inHead = (px-cx)**2 + (py-8)**2 < 49;   // radius ~7
      const inBody = px >= cx-4 && px <= cx+4 && py >= 14 && py <= 26;
      // Sword indicator on frame > 0 for sword rows
      const inSword = type === 'sword' && frameIndex > 0 &&
                      px >= cx+5 && px <= cx+9 && py >= 10 && py <= 24;

      if (inHead || inBody) {
        const shade = border ? 0 : (inHead ? 30 : 0);
        setPixel(ox+px, oy+py, Math.min(255,r+shade), Math.min(255,g+shade), Math.min(255,b+shade), 255);
      } else if (inSword) {
        setPixel(ox+px, oy+py, 220, 220, 220, 255);
      } else {
        setPixel(ox+px, oy+py, 0, 0, 0, 0); // transparent
      }
    }
  }
}

// Draw all frames
for (let row = 0; row < ROWS; row++) {
  const meta = ROW_META[row];
  for (let col = 0; col < COLS; col++) {
    let dir = meta.dir;
    if (row === 0) dir = IDLE_COL_DIRS[col]; // row 0: each col = different dir
    const color = DIR_COLORS[dir];
    drawFrame(col, row, color, col, meta.type);
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

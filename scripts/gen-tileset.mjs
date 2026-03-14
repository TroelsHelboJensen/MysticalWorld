/**
 * Generates a placeholder 128×128 tileset PNG using only Node.js built-ins.
 * No npm dependencies required.
 *
 * Run: node scripts/gen-tileset.mjs
 *
 * Tile layout (4 cols × 4 rows, each 32×32 px):
 *  0 = transparent/black   1 = grass (green)
 *  2 = water (blue)        3 = dirt (brown)
 *  4 = wall (grey)         5 = sand (tan)
 *  6 = forest (dark green) 7 = path (light brown)
 *  8–15 = reserved (dark grey)
 */

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../assets/tilesets/overworld.png');

const W = 128, H = 128;

// Tile colours as [R, G, B, A]
const TILE_COLORS = [
  [0,   0,   0,   0  ], // 0  transparent
  [74,  124, 63,  255], // 1  grass
  [58,  123, 213, 255], // 2  water
  [139, 99,  64,  255], // 3  dirt
  [107, 107, 107, 255], // 4  wall
  [200, 169, 110, 255], // 5  sand
  [45,  90,  27,  255], // 6  forest
  [176, 128, 80,  255], // 7  path
  [51,  51,  51,  255], // 8-15 reserved
];
const RESERVED = [51, 51, 51, 255];

function tileColor(idx) {
  return TILE_COLORS[idx] ?? RESERVED;
}

// Build raw RGBA pixel buffer
const pixels = Buffer.alloc(W * H * 4);
const TILE = 32, COLS = 4;

for (let py = 0; py < H; py++) {
  for (let px = 0; px < W; px++) {
    const tileCol = Math.floor(px / TILE);
    const tileRow = Math.floor(py / TILE);
    const tileIdx = tileRow * COLS + tileCol;
    const [r, g, b, a] = tileColor(tileIdx);

    // 1px dark border inside each tile
    const localX = px % TILE;
    const localY = py % TILE;
    const border = localX === 0 || localY === 0 || localX === TILE - 1 || localY === TILE - 1;

    const offset = (py * W + px) * 4;
    pixels[offset]     = border ? Math.max(0, r - 40) : r;
    pixels[offset + 1] = border ? Math.max(0, g - 40) : g;
    pixels[offset + 2] = border ? Math.max(0, b - 40) : b;
    pixels[offset + 3] = tileIdx === 0 ? 0 : 255; // tile 0 is transparent
  }
}

// ─── PNG encoder (no deps) ────────────────────────────────────────────────────

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBytes, data]);
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc32(crcInput))]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // colour type: RGBA
ihdr[10] = ihdr[11] = ihdr[12] = 0;

// IDAT — filter byte 0 (None) prepended to each row
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0; // filter None
  pixels.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}
const compressed = deflateSync(raw, { level: 6 });

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log('Written:', OUT);

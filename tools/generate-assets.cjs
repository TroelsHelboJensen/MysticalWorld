#!/usr/bin/env node
/**
 * tools/generate-assets.js
 *
 * Generates placeholder pixel-art assets for MysticalWorld:
 *   assets/tilesets/overworld.png  (128×128 — 4×4 grid of 32×32 tiles)
 *   assets/sprites/hero.png        (128×288 — 4 cols × 9 rows of 32×32 frames)
 *
 * Run:  node tools/generate-assets.js
 */

'use strict';
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ─── PNG encoder ─────────────────────────────────────────────────────────────

const _crcT = (() => {
  const t = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = (_crcT[(c ^ b) & 0xFF] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const L = Buffer.allocUnsafe(4); L.writeUInt32BE(data.length, 0);
  const C = Buffer.allocUnsafe(4); C.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([L, t, data, C]);
}

/** pixels: Uint8Array of width*height*4 (RGBA row-major) */
function encodePNG(width, height, pixels) {
  const raw = Buffer.allocUnsafe(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * (1 + width * 4) + 1 + x * 4;
      raw[di]   = pixels[si];
      raw[di+1] = pixels[si+1];
      raw[di+2] = pixels[si+2];
      raw[di+3] = pixels[si+3];
    }
  }
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=ihdr[11]=ihdr[12]=0;
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Canvas helper ────────────────────────────────────────────────────────────

function makeCanvas(w, h) {
  const data = new Uint8Array(w * h * 4); // all transparent
  const set = (x, y, r, g, b, a=255) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = (y*w+x)*4;
    data[i]=r; data[i+1]=g; data[i+2]=b; data[i+3]=a;
  };
  const fill = (x, y, fw, fh, r, g, b, a=255) => {
    for (let dy=0;dy<fh;dy++) for (let dx=0;dx<fw;dx++) set(x+dx,y+dy,r,g,b,a);
  };
  const clear = (x, y, fw, fh) => fill(x,y,fw,fh,0,0,0,0);
  const circle = (cx, cy, rad, r, g, b, a=255) => {
    for (let dy=-rad;dy<=rad;dy++)
      for (let dx=-rad;dx<=rad;dx++)
        if (dx*dx+dy*dy<=rad*rad) set(cx+dx,cy+dy,r,g,b,a);
  };
  /** stamp another canvas's pixels (skipping transparent) onto this one */
  const stamp = (src, dx, dy) => {
    for (let y=0;y<src.h;y++) for (let x=0;x<src.w;x++) {
      const i=(y*src.w+x)*4;
      if (src.data[i+3]>0) set(dx+x, dy+y, src.data[i], src.data[i+1], src.data[i+2], src.data[i+3]);
    }
  };
  return { w, h, data, set, fill, clear, circle, stamp };
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const O  = [30, 20, 10];       // outline
const SK = [255, 205, 148];    // skin
const SKd= [210, 158,  90];    // skin dark
const HA = [245, 205,  35];    // hair yellow
const HAd= [190, 150,  20];    // hair dark
const TU = [ 65, 155,  65];    // tunic green
const TUd= [ 40, 100,  40];    // tunic dark
const TUh= [100, 200, 100];    // tunic highlight
const PA = [ 45,  75, 190];    // pants blue
const PAd= [ 28,  48, 135];    // pants dark
const BO = [110,  68,  30];    // boots brown
const BOd= [ 68,  42,  15];    // boots dark
const SW = [230, 235, 245];    // sword silver
const SWd= [160, 165, 180];    // sword shadow
const GD = [255, 215,   0];    // gold guard

// ─── Hero frames ─────────────────────────────────────────────────────────────
//
// Sprite layout (4 cols × 9 rows, each cell 32×32):
//   Row 0 : idle   — down, up, left, right
//   Row 1 : walk   — down  × 4 frames
//   Row 2 : walk   — up    × 4 frames
//   Row 3 : walk   — left  × 4 frames
//   Row 4 : walk   — right × 4 frames
//   Row 5 : sword  — down  × 4 frames
//   Row 6 : sword  — up    × 4 frames
//   Row 7 : sword  — left  × 4 frames
//   Row 8 : sword  — right × 4 frames

/** Draw a hero frame facing DOWN.
 * walkPhase: 0=idle,1=left leg fwd,2=neutral,3=right leg fwd */
function heroDown(walkPhase=0) {
  const c = makeCanvas(32, 32);
  // Hair
  c.fill(12, 4, 8, 1, ...HAd);
  c.fill(11, 5, 10, 3, ...HA);
  c.fill(10, 6, 12, 2, ...HA);
  // Face
  c.fill(10, 7, 12, 7, ...SK);
  // Eyes
  c.fill(12, 9, 2, 2, ...O);
  c.fill(18, 9, 2, 2, ...O);
  // Nose
  c.set(15, 11, ...SKd);
  // Mouth
  c.fill(13, 13, 6, 1, ...O);
  c.fill(14, 12, 4, 1, ...SKd);
  // Outline face
  c.fill(10, 7,  1, 7, ...O);
  c.fill(21, 7,  1, 7, ...O);
  c.fill(11, 13, 10, 1, ...O);
  // Neck
  c.fill(14, 14, 4, 2, ...SK);
  // Body (tunic)
  c.fill( 8, 16, 16, 7, ...TU);
  c.fill( 8, 16,  2, 7, ...TUd);
  c.fill(22, 16,  2, 7, ...TUd);
  c.fill( 9, 16, 14, 1, ...TUh);  // shoulder highlight
  // Belt
  c.fill( 8, 23,  16, 1, ...BOd);
  // Arms
  c.fill( 6, 16, 3, 6, ...SK);
  c.fill( 6, 16, 1, 6, ...O);
  c.fill(23, 16, 3, 6, ...SK);
  c.fill(25, 16, 1, 6, ...O);
  // Hands
  c.fill( 6, 21, 3, 2, ...SKd);
  c.fill(23, 21, 3, 2, ...SKd);
  // Outline body
  c.fill( 8, 16, 16, 1, ...O);  // shoulder top
  c.fill( 7, 16,  1, 7, ...O);  // body left
  c.fill(24, 16,  1, 7, ...O);  // body right
  // Legs
  const ll = walkPhase===1 ? -2 : (walkPhase===3 ?  1 : 0);
  const rl = walkPhase===1 ?  1 : (walkPhase===3 ? -2 : 0);
  c.fill( 9, 24+ll, 6, 5, ...PA);
  c.fill(17, 24+rl, 6, 5, ...PA);
  c.fill( 9, 24+ll, 1, 5, ...PAd);
  c.fill(17, 24+rl, 1, 5, ...PAd);
  // Boots
  c.fill( 8, 29+ll, 7, 3, ...BO);
  c.fill(17, 29+rl, 7, 3, ...BO);
  c.fill( 8, 29+ll, 1, 3, ...BOd);
  c.fill(17, 29+rl, 1, 3, ...BOd);
  return c;
}

/** Draw a hero frame facing UP. */
function heroUp(walkPhase=0) {
  const c = makeCanvas(32, 32);
  // Hair (back of head — full coverage)
  c.fill(10, 5, 12, 9, ...HA);
  c.fill( 9, 6, 14, 7, ...HA);
  c.fill(11, 4, 10, 2, ...HAd);
  // outline head
  c.fill( 9, 5,  1, 8, ...O);
  c.fill(22, 5,  1, 8, ...O);
  c.fill(10, 13, 12, 1, ...O);
  // Neck
  c.fill(14, 14, 4, 2, ...SKd);
  // Body
  c.fill( 8, 16, 16, 7, ...TU);
  c.fill( 8, 16, 2,  7, ...TUd);
  c.fill(22, 16, 2,  7, ...TUd);
  c.fill( 9, 16, 14, 1, ...TUh);
  c.fill( 8, 23, 16, 1, ...BOd);
  // Arms
  c.fill( 6, 16, 3, 6, ...TUd);
  c.fill(23, 16, 3, 6, ...TUd);
  // Outline body
  c.fill( 8, 16, 16, 1, ...O);
  c.fill( 7, 16,  1, 7, ...O);
  c.fill(24, 16,  1, 7, ...O);
  // Legs
  const ll = walkPhase===1 ? -2 : (walkPhase===3 ?  1 : 0);
  const rl = walkPhase===1 ?  1 : (walkPhase===3 ? -2 : 0);
  c.fill( 9, 24+ll, 6, 5, ...PA);
  c.fill(17, 24+rl, 6, 5, ...PA);
  c.fill( 8, 29+ll, 7, 3, ...BO);
  c.fill(17, 29+rl, 7, 3, ...BO);
  return c;
}

/** Draw a hero frame facing LEFT (mirrored for right). */
function heroSide(walkPhase=0, flip=false) {
  const c = makeCanvas(32, 32);
  // Hair
  c.fill(11, 4, 11, 2, ...HAd);
  c.fill(10, 5, 13, 4, ...HA);
  c.fill(11, 5,  3, 8, ...HA);  // hair drape on face-side
  // Head
  c.fill(12, 6, 8, 8, ...SK);
  c.fill(10, 6, 3, 7, ...HA);   // side hair
  // Eye (single, on far side)
  c.fill(17, 9, 2, 2, ...O);
  // Nose
  c.set(19, 11, ...SKd);
  // Mouth
  c.fill(16, 13, 4, 1, ...O);
  // Outline
  c.fill(11, 6,  1, 8, ...O);
  c.fill(20, 6,  1, 8, ...O);
  c.fill(12, 13, 8, 1, ...O);
  // Neck
  c.fill(14, 14, 4, 2, ...SK);
  // Body
  c.fill( 9, 16, 14, 7, ...TU);
  c.fill( 9, 16,  2, 7, ...TUd);
  c.fill(21, 16,  2, 7, ...TUd);
  c.fill(10, 16, 12, 1, ...TUh);
  c.fill( 9, 23, 14, 1, ...BOd);
  // Arms
  c.fill( 7, 16, 3, 6, ...SK);  // near arm (front)
  c.fill(22, 16, 3, 6, ...TUd); // far arm (back)
  // Outline body
  c.fill( 9, 16, 14, 1, ...O);
  c.fill( 8, 16,  1, 7, ...O);
  c.fill(23, 16,  1, 7, ...O);
  // Legs - side view (single leg visible partially)
  const legFwd = walkPhase===1 ? -2 : (walkPhase===3 ? 2 : 0);
  const legBck = walkPhase===1 ?  2 : (walkPhase===3 ? -2 : 0);
  c.fill( 9, 24+legBck, 6, 5, ...PAd); // back leg
  c.fill(12, 24+legFwd, 7, 5, ...PA);  // front leg
  c.fill( 9, 29+legBck, 7, 3, ...BOd); // back boot
  c.fill(12, 29+legFwd, 8, 3, ...BO);  // front boot

  if (flip) {
    // Horizontally mirror the canvas
    const mirrored = makeCanvas(32, 32);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const si = (y*32+x)*4;
        const di = (y*32+(31-x))*4;
        mirrored.data[di]   = c.data[si];
        mirrored.data[di+1] = c.data[si+1];
        mirrored.data[di+2] = c.data[si+2];
        mirrored.data[di+3] = c.data[si+3];
      }
    return mirrored;
  }
  return c;
}

/** Sword swing frame — DOWN direction */
function heroSwordDown(frame=0) {
  const c = heroDown(0);
  // Extend right arm holding sword
  const progress = frame / 3;
  const sx = 23 + Math.round(progress * 4);
  const sy = 16 - Math.round(progress * 2);
  // Sword blade
  c.fill(sx, sy,     2, 8, ...SWd);
  c.fill(sx+1, sy,   2, 8, ...SW);
  // Guard
  c.fill(sx-1, sy+8, 5, 2, ...GD);
  // Handle
  c.fill(sx,  sy+10, 2, 3, ...BOd);
  return c;
}

/** Sword swing — UP direction */
function heroSwordUp(frame=0) {
  const c = heroUp(0);
  const progress = frame / 3;
  const sx = 22 + Math.round(progress * 3);
  const sy = 12 - Math.round(progress * 3);
  c.fill(sx,   sy,   2, 8, ...SWd);
  c.fill(sx+1, sy,   2, 8, ...SW);
  c.fill(sx-1, sy+8, 5, 2, ...GD);
  c.fill(sx,  sy+10, 2, 3, ...BOd);
  return c;
}

/** Sword swing — LEFT direction */
function heroSwordLeft(frame=0) {
  const c = heroSide(0, false);
  const progress = frame / 3;
  const sx = 4 + Math.round(progress * 2);
  const sy = 14 - Math.round(progress * 4);
  c.fill(sx, sy,   2, 9, ...SWd);
  c.fill(sx+1, sy, 2, 9, ...SW);
  c.fill(sx-1, sy+9, 5, 2, ...GD);
  c.fill(sx, sy+11, 2, 3, ...BOd);
  return c;
}

/** Sword swing — RIGHT direction */
function heroSwordRight(frame=0) {
  const c = heroSide(0, true);
  const progress = frame / 3;
  const sx = 26 - Math.round(progress * 2);
  const sy = 14 - Math.round(progress * 4);
  c.fill(sx, sy,   2, 9, ...SWd);
  c.fill(sx+1, sy, 2, 9, ...SW);
  c.fill(sx-1, sy+9, 5, 2, ...GD);
  c.fill(sx, sy+11, 2, 3, ...BOd);
  return c;
}

// ─── Assemble hero spritesheet ────────────────────────────────────────────────

function buildHeroSheet() {
  const COLS = 4, ROWS = 9, TW = 32, TH = 32;
  const sheet = makeCanvas(COLS * TW, ROWS * TH);

  const WALK = [0, 1, 0, 3]; // walk phases for frames 0-3

  // Row 0: idle
  sheet.stamp(heroDown(0),      0*TW, 0*TH);
  sheet.stamp(heroUp(0),        1*TW, 0*TH);
  sheet.stamp(heroSide(0,false),2*TW, 0*TH);
  sheet.stamp(heroSide(0,true), 3*TW, 0*TH);

  // Row 1: walk down
  for (let f=0;f<4;f++) sheet.stamp(heroDown(WALK[f]),  f*TW, 1*TH);
  // Row 2: walk up
  for (let f=0;f<4;f++) sheet.stamp(heroUp(WALK[f]),    f*TW, 2*TH);
  // Row 3: walk left
  for (let f=0;f<4;f++) sheet.stamp(heroSide(WALK[f],false), f*TW, 3*TH);
  // Row 4: walk right
  for (let f=0;f<4;f++) sheet.stamp(heroSide(WALK[f],true),  f*TW, 4*TH);

  // Row 5: sword down
  for (let f=0;f<4;f++) sheet.stamp(heroSwordDown(f),  f*TW, 5*TH);
  // Row 6: sword up
  for (let f=0;f<4;f++) sheet.stamp(heroSwordUp(f),    f*TW, 6*TH);
  // Row 7: sword left
  for (let f=0;f<4;f++) sheet.stamp(heroSwordLeft(f),  f*TW, 7*TH);
  // Row 8: sword right
  for (let f=0;f<4;f++) sheet.stamp(heroSwordRight(f), f*TW, 8*TH);

  return sheet;
}

// ─── Tiles ────────────────────────────────────────────────────────────────────

function tileGrass() {
  const c = makeCanvas(32, 32);
  c.fill(0, 0, 32, 32, 74, 138, 42);
  // Variation dots — lighter & darker
  const light = [[3,2],[9,5],[18,3],[26,7],[5,13],[14,11],[22,15],[8,21],[20,19],[28,24],[4,28],[15,26],[25,29],[11,29]];
  for (const [x,y] of light) { c.fill(x,y,3,2, 95,168,55); }
  const dark  = [[7,7],[16,6],[25,2],[2,18],[12,17],[23,10],[6,25],[17,23],[29,16],[10,30]];
  for (const [x,y] of dark)  { c.fill(x,y,2,2, 55,108,28); }
  return c;
}

function tileWall() {
  const c = makeCanvas(32, 32);
  // Mortar fill
  c.fill(0, 0, 32, 32, 82, 78, 74);
  // Brick rows: each 8px tall with 1px mortar gap, bricks 14px wide
  // Row A (y 1-7) — left-aligned bricks
  c.fill( 1, 1, 13, 7, 148, 142, 135); // brick 1
  c.fill(16, 1, 15, 7, 148, 142, 135); // brick 2
  // Row A highlights
  c.fill( 1, 1, 13, 1, 175, 170, 162);
  c.fill(16, 1, 15, 1, 175, 170, 162);
  // Row B (y 10-16) — offset by 8
  c.fill( 0,10,  7, 7, 148, 142, 135); // partial left
  c.fill( 9,10, 13, 7, 148, 142, 135); // middle
  c.fill(24,10,  8, 7, 148, 142, 135); // partial right
  c.fill( 0,10,  7, 1, 175, 170, 162);
  c.fill( 9,10, 13, 1, 175, 170, 162);
  c.fill(24,10,  8, 1, 175, 170, 162);
  // Row C (y 19-25) — same as row A
  c.fill( 1,19, 13, 7, 148, 142, 135);
  c.fill(16,19, 15, 7, 148, 142, 135);
  c.fill( 1,19, 13, 1, 175, 170, 162);
  c.fill(16,19, 15, 1, 175, 170, 162);
  return c;
}

function tileWater() {
  const c = makeCanvas(32, 32);
  c.fill(0, 0, 32, 32, 38, 110, 195);
  // Wave highlights
  for (let x=0;x<32;x++) {
    const y1 = 6  + Math.round(Math.sin(x * 0.35) * 2);
    const y2 = 18 + Math.round(Math.sin(x * 0.35 + Math.PI) * 2);
    c.set(x, y1, 80, 160, 240);
    c.set(x, y1+1, 55, 135, 215);
    c.set(x, y2, 80, 160, 240);
    c.set(x, y2+1, 55, 135, 215);
  }
  return c;
}

function tilePath() {
  const c = makeCanvas(32, 32);
  c.fill(0, 0, 32, 32, 165, 130, 80);
  const pebbles = [[4,4],[11,3],[20,5],[28,8],[7,14],[16,12],[25,15],[3,22],[13,20],[22,23],[9,28],[19,27],[28,25]];
  for (const [x,y] of pebbles) {
    c.fill(x, y, 3, 2, 138, 108, 62);
    c.set(x+1, y, 180, 145, 95); // highlight
  }
  return c;
}

function tileSand() {
  const c = makeCanvas(32, 32);
  c.fill(0, 0, 32, 32, 210, 190, 120);
  for (let i=0;i<20;i++) {
    const x=(i*13+7)%30, y=(i*17+3)%30;
    c.set(x, y, 190, 168, 95);
  }
  return c;
}

function tileFloor() {
  const c = makeCanvas(32, 32);
  c.fill(0, 0, 32, 32, 180, 165, 140);
  // Grid lines (dungeon floor)
  for (let x=0;x<32;x+=8) c.fill(x, 0, 1, 32, 155, 140, 118);
  for (let y=0;y<32;y+=8) c.fill(0, y, 32, 1, 155, 140, 118);
  return c;
}

// ─── Assemble tileset ─────────────────────────────────────────────────────────
// 128×128 = 4×4 grid of 32×32 tiles
// Index (col, row):
//   (0,0)=grass  (1,0)=wall   (2,0)=water  (3,0)=path
//   (0,1)=sand   (1,1)=floor  (2,1)=grass2 (3,1)=wall2
//   ... remaining = copies for variety

function buildTileset() {
  const sheet = makeCanvas(128, 128);
  const tiles = [
    [tileGrass(),  0, 0],
    [tileWall(),   1, 0],
    [tileWater(),  2, 0],
    [tilePath(),   3, 0],
    [tileSand(),   0, 1],
    [tileFloor(),  1, 1],
    [tileGrass(),  2, 1],  // re-use grass
    [tileWall(),   3, 1],  // re-use wall
    [tilePath(),   0, 2],
    [tileFloor(),  1, 2],
    [tileGrass(),  2, 2],
    [tileWall(),   3, 2],
    [tileSand(),   0, 3],
    [tileWater(),  1, 3],
    [tileGrass(),  2, 3],
    [tileFloor(),  3, 3],
  ];
  for (const [tile, col, row] of tiles) {
    sheet.stamp(tile, col * 32, row * 32);
  }
  return sheet;
}

// ─── Write files ──────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

function write(relPath, canvas) {
  const full = path.join(ROOT, relPath);
  const png  = encodePNG(canvas.w, canvas.h, canvas.data);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, png);
  console.log(`✓  ${relPath}  (${canvas.w}×${canvas.h}, ${png.length} bytes)`);
}

console.log('Generating MysticalWorld placeholder assets…\n');
write('assets/tilesets/overworld.png', buildTileset());
write('assets/sprites/hero.png',       buildHeroSheet());
console.log('\nDone. Refresh the browser to see changes.');

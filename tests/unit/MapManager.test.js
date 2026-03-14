import { describe, it, expect, beforeEach } from 'vitest';
import { MapManager } from '../../maps/MapManager.js';

// Minimal 4×3 map fixture — keeps tests fast and readable.
function makeMapData({ collisionData } = {}) {
  const W = 4, H = 3;
  const empty = Array(W * H).fill(0);
  return {
    width: W,
    height: H,
    tilewidth: 32,
    tileheight: 32,
    layers: [
      { name: 'Ground',    data: Array(W * H).fill(1) },
      { name: 'Details',   data: [...empty] },
      { name: 'Collision', data: collisionData ?? [...empty] },
    ],
  };
}

describe('MapManager', () => {
  describe('dimensions', () => {
    it('exposes tile size from map data', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.tileWidth).toBe(32);
      expect(mgr.tileHeight).toBe(32);
    });

    it('exposes map size in tiles', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.mapWidthTiles).toBe(4);
      expect(mgr.mapHeightTiles).toBe(3);
    });

    it('exposes map size in pixels', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.mapWidthPx).toBe(128);   // 4 * 32
      expect(mgr.mapHeightPx).toBe(96);   // 3 * 32
    });
  });

  describe('getLayer', () => {
    it('returns the matching layer object', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.getLayer('Ground').name).toBe('Ground');
    });

    it('returns undefined for a missing layer', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.getLayer('NoSuchLayer')).toBeUndefined();
    });
  });

  describe('isBlocked', () => {
    it('returns false when the collision layer is empty', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.isBlocked(0, 0)).toBe(false);
      expect(mgr.isBlocked(2, 1)).toBe(false);
    });

    it('returns true for a non-zero collision tile', () => {
      // Place tile 2 at position (1, 0) → index 1 in a 4-wide map
      const data = Array(12).fill(0);
      data[1] = 2;
      const mgr = new MapManager(makeMapData({ collisionData: data }));
      expect(mgr.isBlocked(1, 0)).toBe(true);
    });

    it('returns false for a zero tile even if other tiles are blocked', () => {
      const data = Array(12).fill(0);
      data[1] = 2;
      const mgr = new MapManager(makeMapData({ collisionData: data }));
      expect(mgr.isBlocked(0, 0)).toBe(false);
    });

    it('returns false when there is no Collision layer', () => {
      const mapData = {
        width: 4, height: 3, tilewidth: 32, tileheight: 32,
        layers: [{ name: 'Ground', data: Array(12).fill(1) }],
      };
      const mgr = new MapManager(mapData);
      expect(mgr.isBlocked(0, 0)).toBe(false);
    });
  });

  describe('isBlockedAt', () => {
    it('converts pixel coords to tile coords correctly', () => {
      // Block tile (2, 1) → pixel range x:[64,95], y:[32,63]
      const data = Array(12).fill(0);
      data[1 * 4 + 2] = 2; // row 1, col 2 → index 6
      const mgr = new MapManager(makeMapData({ collisionData: data }));

      expect(mgr.isBlockedAt(64, 32)).toBe(true);  // exactly tile (2,1)
      expect(mgr.isBlockedAt(80, 50)).toBe(true);  // inside tile (2,1)
      expect(mgr.isBlockedAt(32, 32)).toBe(false); // tile (1,1) — clear
    });
  });

  describe('getTransition', () => {
    it('returns null when there is no Transitions layer', () => {
      const mgr = new MapManager(makeMapData());
      expect(mgr.getTransition(0, 0)).toBeNull();
    });

    it('returns transition data when the tile overlaps a transition object', () => {
      const mapData = makeMapData();
      mapData.layers.push({
        name: 'Transitions',
        objects: [
          {
            x: 0, y: 0, width: 32, height: 32,
            properties: [
              { name: 'targetMap', value: 'dungeon1' },
              { name: 'spawnX',    value: 5 },
              { name: 'spawnY',    value: 3 },
            ],
          },
        ],
      });
      const mgr = new MapManager(mapData);
      expect(mgr.getTransition(0, 0)).toEqual({
        targetMap: 'dungeon1',
        spawnX: 5,
        spawnY: 3,
      });
    });

    it('returns null when the tile is outside all transition objects', () => {
      const mapData = makeMapData();
      mapData.layers.push({
        name: 'Transitions',
        objects: [{ x: 0, y: 0, width: 32, height: 32, properties: [] }],
      });
      const mgr = new MapManager(mapData);
      expect(mgr.getTransition(2, 2)).toBeNull();
    });
  });
});

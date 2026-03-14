/**
 * MapManager — pure JS, no Phaser dependency.
 *
 * Owns the loaded map data and exposes helpers that GameScene uses to
 * render tilemaps, check collisions and trigger scene transitions.
 */
export class MapManager {
  /**
   * @param {object} mapData  Tiled-compatible JSON (already parsed)
   */
  constructor(mapData) {
    this._mapData = mapData;
    this._collisionTileIds = new Set();

    this._indexCollisionLayer();
  }

  // ─── Public getters ────────────────────────────────────────────────────────

  get tileWidth() {
    return this._mapData.tilewidth;
  }

  get tileHeight() {
    return this._mapData.tileheight;
  }

  /** Map width in tiles */
  get mapWidthTiles() {
    return this._mapData.width;
  }

  /** Map height in tiles */
  get mapHeightTiles() {
    return this._mapData.height;
  }

  /** Map width in pixels */
  get mapWidthPx() {
    return this._mapData.width * this._mapData.tilewidth;
  }

  /** Map height in pixels */
  get mapHeightPx() {
    return this._mapData.height * this._mapData.tileheight;
  }

  get mapData() {
    return this._mapData;
  }

  // ─── Layer helpers ─────────────────────────────────────────────────────────

  /**
   * Returns the layer object with the given name, or undefined.
   * @param {string} name
   */
  getLayer(name) {
    return this._mapData.layers.find((l) => l.name === name);
  }

  // ─── Collision ─────────────────────────────────────────────────────────────

  /**
   * Returns true when the tile at (tileX, tileY) on the Collision layer
   * blocks movement.
   * @param {number} tileX
   * @param {number} tileY
   */
  isBlocked(tileX, tileY) {
    const layer = this.getLayer('Collision');
    if (!layer) return false;

    const index = tileY * this._mapData.width + tileX;
    const tileId = layer.data[index];
    return this._collisionTileIds.has(tileId);
  }

  /**
   * Returns true when the world-space pixel point (px, py) lands on a
   * blocked tile.
   * @param {number} px
   * @param {number} py
   */
  isBlockedAt(px, py) {
    const tileX = Math.floor(px / this._mapData.tilewidth);
    const tileY = Math.floor(py / this._mapData.tileheight);
    return this.isBlocked(tileX, tileY);
  }

  // ─── Scene transitions ─────────────────────────────────────────────────────

  /**
   * Returns the transition definition for the tile at (tileX, tileY), or
   * null if there is none.
   *
   * Transitions are stored as Tiled objects in a layer named "Transitions".
   * Each object has a `properties` array with `{ name: 'targetMap', value }`.
   *
   * @param {number} tileX
   * @param {number} tileY
   * @returns {{ targetMap: string, spawnX: number, spawnY: number } | null}
   */
  getTransition(tileX, tileY) {
    const layer = this.getLayer('Transitions');
    if (!layer || !layer.objects) return null;

    const px = tileX * this._mapData.tilewidth;
    const py = tileY * this._mapData.tileheight;

    const obj = layer.objects.find(
      (o) => px >= o.x && px < o.x + o.width && py >= o.y && py < o.y + o.height
    );
    if (!obj) return null;

    const props = Object.fromEntries(
      (obj.properties || []).map((p) => [p.name, p.value])
    );
    return {
      targetMap: props.targetMap ?? null,
      spawnX: props.spawnX ?? 0,
      spawnY: props.spawnY ?? 0,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Walk the Collision layer and collect every non-zero tile ID.
   * Any non-zero tile in the collision layer blocks movement.
   */
  _indexCollisionLayer() {
    const layer = this.getLayer('Collision');
    if (!layer) return;

    for (const id of layer.data) {
      if (id !== 0) this._collisionTileIds.add(id);
    }
  }
}

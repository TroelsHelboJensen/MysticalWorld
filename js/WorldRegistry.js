/**
 * WorldRegistry – pure JS catalogue of every map in the game world.
 *
 * Each entry:
 *   id        – unique string key used to look up the map (e.g. "overworld")
 *   file      – path to the Tiled JSON, relative to the project root
 *   spawnX    – default hero spawn tile-X when entering this map
 *   spawnY    – default hero spawn tile-Y when entering this map
 *   type      – "overworld" | "village" | "dungeon"
 *
 * Usage:
 *   const reg = new WorldRegistry();
 *   const entry = reg.get('village');  // → { id, file, spawnX, spawnY, type }
 *   reg.getAll();                      // → all entries
 *   reg.getByType('dungeon');          // → dungeon entries only
 */
export class WorldRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._maps = new Map();
    this._registerDefaults();
  }

  /**
   * @param {string} id
   * @returns {{ id:string, file:string, spawnX:number, spawnY:number, type:string } | undefined}
   */
  get(id) {
    return this._maps.get(id);
  }

  /** @returns {Array<object>} */
  getAll() {
    return [...this._maps.values()];
  }

  /**
   * @param {'overworld'|'village'|'dungeon'} type
   * @returns {Array<object>}
   */
  getByType(type) {
    return [...this._maps.values()].filter(e => e.type === type);
  }

  /**
   * Register a custom map entry (useful for tests or modding).
   * Overwrites existing entry with the same id.
   */
  register({ id, file, spawnX = 1, spawnY = 1, type = 'overworld' }) {
    this._maps.set(id, Object.freeze({ id, file, spawnX, spawnY, type }));
  }

  // ── private ──────────────────────────────────────────────────────────────

  _registerDefaults() {
    const defaults = [
      {
        id: 'overworld', type: 'overworld',
        file: 'maps/overworld.json',
        spawnX: 20, spawnY: 15,
      },
      {
        id: 'village', type: 'village',
        file: 'maps/village.json',
        spawnX: 15, spawnY: 18,
      },
      {
        id: 'dungeon1', type: 'dungeon',
        file: 'maps/dungeons/dungeon1.json',
        spawnX: 4, spawnY: 7,
      },
    ];
    for (const entry of defaults) this.register(entry);
  }
}

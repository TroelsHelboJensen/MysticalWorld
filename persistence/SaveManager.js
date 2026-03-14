export class SaveManager {
  static SLOT_COUNT = 3;
  static KEY_PREFIX = 'mw_save_';

  _key(slot) {
    if (slot < 0 || slot >= SaveManager.SLOT_COUNT) {
      throw new RangeError(`Save slot must be 0–${SaveManager.SLOT_COUNT - 1}, got ${slot}`);
    }
    return `${SaveManager.KEY_PREFIX}${slot}`;
  }

  /**
   * Save state to a slot (0, 1, or 2).
   * @param {number} slot
   * @param {object} state
   */
  save(slot, state) {
    localStorage.setItem(this._key(slot), JSON.stringify(state));
  }

  /**
   * Load state from a slot.
   * @param {number} slot
   * @returns {object|null}  parsed state, or null if empty or corrupt
   */
  load(slot) {
    const raw = localStorage.getItem(this._key(slot));
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Delete the save in a slot.
   * @param {number} slot
   */
  delete(slot) {
    localStorage.removeItem(this._key(slot));
  }

  /**
   * List all slot metadata.
   * @returns {Array<{ slot: number, exists: boolean, heroName?: string }>}
   */
  listSlots() {
    return Array.from({ length: SaveManager.SLOT_COUNT }, (_, slot) => {
      const state = this.load(slot);
      if (!state) return { slot, exists: false };
      return {
        slot,
        exists: true,
        ...(state.hero?.name ? { heroName: state.hero.name } : {}),
      };
    });
  }
}

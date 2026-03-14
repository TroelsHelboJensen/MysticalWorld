import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../persistence/SaveManager.js';

const SAMPLE_STATE = {
  hero: {
    name:     'Hero',
    hp:       80,
    maxHp:    100,
    position: { x: 320, y: 240 },
    stats:    { attack: 10, defense: 5, speed: 160 },
    inventory: [null],
    equipped:  { weapon: null, shield: null, armor: null, accessory: null },
  },
  currency: { totalSilver: 347 },
  world: {
    mapId:        'overworld',
    roomId:       'start',
    visitedRooms: ['start'],
    chestStates:  {},
    questFlags:   {},
  },
};

describe('SaveManager', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new SaveManager();
  });

  // ─── save / load ─────────────────────────────────────────────────────────────

  describe('save and load', () => {
    it('roundtrip: saved state equals loaded state', () => {
      manager.save(0, SAMPLE_STATE);
      expect(manager.load(0)).toEqual(SAMPLE_STATE);
    });

    it('load returns null for an empty slot', () => {
      expect(manager.load(1)).toBeNull();
    });

    it('load returns null for corrupt JSON', () => {
      localStorage.setItem('mw_save_2', '{not valid json}');
      expect(manager.load(2)).toBeNull();
    });

    it('saves independently across slots', () => {
      const state2 = { ...SAMPLE_STATE, currency: { totalSilver: 999 } };
      manager.save(0, SAMPLE_STATE);
      manager.save(1, state2);
      expect(manager.load(0).currency.totalSilver).toBe(347);
      expect(manager.load(1).currency.totalSilver).toBe(999);
    });

    it('throws RangeError for out-of-range slot on save', () => {
      expect(() => manager.save(3, SAMPLE_STATE)).toThrow(RangeError);
      expect(() => manager.save(-1, SAMPLE_STATE)).toThrow(RangeError);
    });

    it('throws RangeError for out-of-range slot on load', () => {
      expect(() => manager.load(5)).toThrow(RangeError);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('removes save; subsequent load returns null', () => {
      manager.save(0, SAMPLE_STATE);
      manager.delete(0);
      expect(manager.load(0)).toBeNull();
    });

    it('does not throw when deleting an empty slot', () => {
      expect(() => manager.delete(1)).not.toThrow();
    });
  });

  // ─── listSlots ───────────────────────────────────────────────────────────────

  describe('listSlots', () => {
    it('returns exactly 3 entries', () => {
      expect(manager.listSlots()).toHaveLength(3);
    });

    it('all slots show exists: false on empty storage', () => {
      manager.listSlots().forEach(s => expect(s.exists).toBe(false));
    });

    it('shows exists: true after saving', () => {
      manager.save(1, SAMPLE_STATE);
      const slots = manager.listSlots();
      expect(slots[0].exists).toBe(false);
      expect(slots[1].exists).toBe(true);
      expect(slots[2].exists).toBe(false);
    });

    it('includes heroName when available', () => {
      manager.save(0, SAMPLE_STATE);
      expect(manager.listSlots()[0].heroName).toBe('Hero');
    });

    it('does not include heroName when not in state', () => {
      const stateNoName = { ...SAMPLE_STATE, hero: { ...SAMPLE_STATE.hero, name: undefined } };
      manager.save(0, stateNoName);
      expect(manager.listSlots()[0]).not.toHaveProperty('heroName');
    });
  });
});

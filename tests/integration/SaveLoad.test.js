import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../../persistence/SaveManager.js';

describe('SaveLoad integration', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new SaveManager();
  });

  it('full roundtrip preserves all state fields', () => {
    const state = {
      hero: {
        name:     'Troels',
        hp:       80,
        maxHp:    100,
        position: { x: 320, y: 240 },
        stats:    { attack: 10, defense: 5, speed: 160 },
        inventory: [
          null,
          { name: 'Iron Sword', slot: 'weapon', stats: { attack: 8 }, value: 50 },
          null,
        ],
        equipped: { weapon: null, shield: null, armor: null, accessory: null },
      },
      currency: { totalSilver: 347 },
      world: {
        mapId:        'overworld',
        roomId:       'start',
        visitedRooms: ['start', 'north'],
        chestStates:  { chest_001: true },
        questFlags:   { metVillager: true },
      },
    };

    manager.save(0, state);
    const loaded = manager.load(0);
    expect(loaded).toEqual(state);
  });

  it('multiple saves and loads do not interfere', () => {
    const stateA = { currency: { totalSilver: 100 }, world: { mapId: 'dungeon' } };
    const stateB = { currency: { totalSilver: 500 }, world: { mapId: 'overworld' } };

    manager.save(0, stateA);
    manager.save(2, stateB);

    expect(manager.load(0)).toEqual(stateA);
    expect(manager.load(1)).toBeNull();
    expect(manager.load(2)).toEqual(stateB);
  });

  it('delete then re-save works correctly', () => {
    const original = { currency: { totalSilver: 100 } };
    const updated  = { currency: { totalSilver: 999 } };

    manager.save(0, original);
    manager.delete(0);
    manager.save(0, updated);

    expect(manager.load(0)).toEqual(updated);
  });
});

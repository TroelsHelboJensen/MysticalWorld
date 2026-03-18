import { describe, it, expect, beforeEach } from 'vitest';
import { WorldRegistry } from '../../js/WorldRegistry.js';

describe('WorldRegistry – default entries', () => {
  let reg;
  beforeEach(() => { reg = new WorldRegistry(); });

  it('has 3 default maps', () => {
    expect(reg.getAll()).toHaveLength(3);
  });

  it('registers overworld', () => {
    const entry = reg.get('overworld');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('overworld');
    expect(entry.file).toBe('maps/overworld.json');
  });

  it('registers village', () => {
    const entry = reg.get('village');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('village');
    expect(entry.file).toBe('maps/village.json');
  });

  it('registers dungeon1', () => {
    const entry = reg.get('dungeon1');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('dungeon');
    expect(entry.file).toBe('maps/dungeons/dungeon1.json');
  });

  it('all entries have spawnX and spawnY', () => {
    for (const entry of reg.getAll()) {
      expect(typeof entry.spawnX).toBe('number');
      expect(typeof entry.spawnY).toBe('number');
    }
  });
});

describe('WorldRegistry – get', () => {
  let reg;
  beforeEach(() => { reg = new WorldRegistry(); });

  it('returns undefined for unknown id', () => {
    expect(reg.get('unknown_map')).toBeUndefined();
  });

  it('entry is frozen (immutable)', () => {
    const entry = reg.get('overworld');
    expect(() => { entry.file = 'hacked'; }).toThrow();
  });
});

describe('WorldRegistry – getByType', () => {
  let reg;
  beforeEach(() => { reg = new WorldRegistry(); });

  it('returns only dungeon entries', () => {
    const dungeons = reg.getByType('dungeon');
    expect(dungeons).toHaveLength(1);
    expect(dungeons[0].id).toBe('dungeon1');
  });

  it('returns only village entries', () => {
    const villages = reg.getByType('village');
    expect(villages).toHaveLength(1);
    expect(villages[0].id).toBe('village');
  });

  it('returns only overworld entries', () => {
    const worlds = reg.getByType('overworld');
    expect(worlds).toHaveLength(1);
    expect(worlds[0].id).toBe('overworld');
  });

  it('returns empty array for unknown type', () => {
    expect(reg.getByType('nonexistent')).toHaveLength(0);
  });
});

describe('WorldRegistry – register', () => {
  let reg;
  beforeEach(() => { reg = new WorldRegistry(); });

  it('adds a new custom map', () => {
    reg.register({ id: 'cave', file: 'maps/cave.json', spawnX: 2, spawnY: 3, type: 'dungeon' });
    expect(reg.get('cave')).toBeDefined();
    expect(reg.getAll()).toHaveLength(4);
  });

  it('overwrites an existing map', () => {
    reg.register({ id: 'overworld', file: 'maps/overworld_v2.json', spawnX: 5, spawnY: 5 });
    expect(reg.get('overworld').file).toBe('maps/overworld_v2.json');
    expect(reg.getAll()).toHaveLength(3); // count unchanged
  });

  it('defaults spawnX/spawnY to 1 when omitted', () => {
    reg.register({ id: 'minimal', file: 'maps/minimal.json' });
    const entry = reg.get('minimal');
    expect(entry.spawnX).toBe(1);
    expect(entry.spawnY).toBe(1);
  });

  it('defaults type to overworld when omitted', () => {
    reg.register({ id: 'secret', file: 'maps/secret.json' });
    expect(reg.get('secret').type).toBe('overworld');
  });
});

import { describe, it, expect } from 'vitest';
import { StatSystem } from '../../js/StatSystem.js';

const BASE = { attack: 10, defense: 5, speed: 160, maxHp: 100 };

const emptyEquipped = { weapon: null, shield: null, armor: null, accessory: null };

describe('StatSystem', () => {
  describe('calculate', () => {
    it('returns base stats unchanged when nothing is equipped', () => {
      const result = StatSystem.calculate(BASE, emptyEquipped);
      expect(result).toEqual(BASE);
    });

    it('adds weapon attack bonus', () => {
      const equipped = { ...emptyEquipped, weapon: { stats: { attack: 5 } } };
      const result = StatSystem.calculate(BASE, equipped);
      expect(result.attack).toBe(15);
      expect(result.defense).toBe(5); // unchanged
    });

    it('adds shield defense bonus', () => {
      const equipped = { ...emptyEquipped, shield: { stats: { defense: 4 } } };
      const result = StatSystem.calculate(BASE, equipped);
      expect(result.defense).toBe(9);
    });

    it('stacks bonuses from multiple items', () => {
      const equipped = {
        weapon:    { stats: { attack: 8 } },
        shield:    { stats: { defense: 4 } },
        armor:     { stats: { defense: 6, maxHp: 20 } },
        accessory: { stats: { speed: 20 } },
      };
      const result = StatSystem.calculate(BASE, equipped);
      expect(result.attack).toBe(18);   // 10+8
      expect(result.defense).toBe(15);  // 5+4+6
      expect(result.maxHp).toBe(120);   // 100+20
      expect(result.speed).toBe(180);   // 160+20
    });

    it('does not mutate the original baseStats object', () => {
      const base = { ...BASE };
      const equipped = { ...emptyEquipped, weapon: { stats: { attack: 5 } } };
      StatSystem.calculate(base, equipped);
      expect(base.attack).toBe(10);
    });

    it('ignores item stats for unknown stat fields', () => {
      const equipped = { ...emptyEquipped, weapon: { stats: { attack: 5, luck: 99 } } };
      const result = StatSystem.calculate(BASE, equipped);
      expect(result.attack).toBe(15);
      expect(result).not.toHaveProperty('luck');
    });

    it('handles items with no stats field gracefully', () => {
      const equipped = { ...emptyEquipped, weapon: { name: 'Broken Sword' } };
      expect(() => StatSystem.calculate(BASE, equipped)).not.toThrow();
    });
  });
});

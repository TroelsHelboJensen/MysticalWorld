import { describe, it, expect } from 'vitest';
import { CombatCalculator } from '../../js/CombatCalculator.js';

describe('CombatCalculator', () => {
  const attacker = { attack: 15 };
  const defender = { defense: 5 };

  // ─── calcDamageWithRandom ───────────────────────────────────────────────────

  describe('calcDamageWithRandom', () => {
    it('returns base damage when no crit (random >= 0.1)', () => {
      const { damage, isCrit } = CombatCalculator.calcDamageWithRandom(attacker, defender, 0.5);
      expect(damage).toBe(10);   // 15 - 5 = 10
      expect(isCrit).toBe(false);
    });

    it('returns crit damage when random < 0.1', () => {
      const { damage, isCrit } = CombatCalculator.calcDamageWithRandom(attacker, defender, 0.09);
      expect(damage).toBe(15);   // floor(10 * 1.5) = 15
      expect(isCrit).toBe(true);
    });

    it('damage is at least 1 when defense equals attack', () => {
      const { damage } = CombatCalculator.calcDamageWithRandom({ attack: 5 }, { defense: 5 }, 0.5);
      expect(damage).toBe(1);
    });

    it('damage is at least 1 when defense exceeds attack', () => {
      const { damage } = CombatCalculator.calcDamageWithRandom({ attack: 2 }, { defense: 20 }, 0.5);
      expect(damage).toBe(1);
    });

    it('crit minimum is also 1 (floored 1 * 1.5 = 1)', () => {
      const { damage, isCrit } = CombatCalculator.calcDamageWithRandom({ attack: 2 }, { defense: 20 }, 0.05);
      expect(damage).toBe(1);   // floor(1 * 1.5) = 1
      expect(isCrit).toBe(true);
    });

    it('crit threshold is exactly 0.1 (0.1 is NOT a crit)', () => {
      const { isCrit } = CombatCalculator.calcDamageWithRandom(attacker, defender, 0.1);
      expect(isCrit).toBe(false);
    });

    it('random 0.0 is always a crit', () => {
      const { isCrit } = CombatCalculator.calcDamageWithRandom(attacker, defender, 0.0);
      expect(isCrit).toBe(true);
    });

    it('crit damage is floored, not rounded', () => {
      // base = 15 - 4 = 11, crit = floor(11 * 1.5) = floor(16.5) = 16
      const { damage } = CombatCalculator.calcDamageWithRandom({ attack: 15 }, { defense: 4 }, 0.05);
      expect(damage).toBe(16);
    });
  });

  // ─── calcDamage (random version) ───────────────────────────────────────────

  describe('calcDamage', () => {
    it('returns an object with damage (number >= 1) and isCrit (boolean)', () => {
      const result = CombatCalculator.calcDamage(attacker, defender);
      expect(typeof result.damage).toBe('number');
      expect(result.damage).toBeGreaterThanOrEqual(1);
      expect(typeof result.isCrit).toBe('boolean');
    });

    it('always returns damage >= 1 for any inputs', () => {
      for (let i = 0; i < 20; i++) {
        const { damage } = CombatCalculator.calcDamage({ attack: 1 }, { defense: 100 });
        expect(damage).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────────

  describe('constants', () => {
    it('CRIT_CHANCE is 0.1', () => {
      expect(CombatCalculator.CRIT_CHANCE).toBe(0.1);
    });

    it('CRIT_MULTIPLIER is 1.5', () => {
      expect(CombatCalculator.CRIT_MULTIPLIER).toBe(1.5);
    });
  });
});

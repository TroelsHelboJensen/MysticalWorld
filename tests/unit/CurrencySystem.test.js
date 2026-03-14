import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencySystem } from '../../js/CurrencySystem.js';

describe('CurrencySystem', () => {
  let currency;

  beforeEach(() => {
    currency = new CurrencySystem();
  });

  // ─── Construction ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('starts at 0 silver by default', () => {
      expect(currency.totalSilver).toBe(0);
    });

    it('accepts an initial silver amount', () => {
      const c = new CurrencySystem(250);
      expect(c.totalSilver).toBe(250);
    });

    it('clamps negative initial values to 0', () => {
      const c = new CurrencySystem(-50);
      expect(c.totalSilver).toBe(0);
    });
  });

  // ─── addSilver ───────────────────────────────────────────────────────────────

  describe('addSilver', () => {
    it('increases totalSilver', () => {
      currency.addSilver(47);
      expect(currency.totalSilver).toBe(47);
    });

    it('accumulates across multiple calls', () => {
      currency.addSilver(50);
      currency.addSilver(50);
      expect(currency.totalSilver).toBe(100);
    });

    it('ignores negative amounts', () => {
      currency.addSilver(10);
      currency.addSilver(-5);
      expect(currency.totalSilver).toBe(10);
    });
  });

  // ─── addGold ─────────────────────────────────────────────────────────────────

  describe('addGold', () => {
    it('adds 100 silver per gold', () => {
      currency.addGold(1);
      expect(currency.totalSilver).toBe(100);
    });

    it('adds 300 silver for 3 gold', () => {
      currency.addGold(3);
      expect(currency.totalSilver).toBe(300);
    });

    it('is equivalent to calling addSilver(100) per gold', () => {
      currency.addGold(2);
      const other = new CurrencySystem();
      other.addSilver(200);
      expect(currency.totalSilver).toBe(other.totalSilver);
    });
  });

  // ─── spend ───────────────────────────────────────────────────────────────────

  describe('spend', () => {
    beforeEach(() => {
      currency.addSilver(100);
    });

    it('returns true and deducts silver when funds are sufficient', () => {
      const result = currency.spend(60);
      expect(result).toBe(true);
      expect(currency.totalSilver).toBe(40);
    });

    it('returns false and does not deduct when funds are insufficient', () => {
      const result = currency.spend(150);
      expect(result).toBe(false);
      expect(currency.totalSilver).toBe(100);
    });

    it('returns true when spending exact available amount', () => {
      const result = currency.spend(100);
      expect(result).toBe(true);
      expect(currency.totalSilver).toBe(0);
    });

    it('returns false when spending from 0 balance', () => {
      currency.spend(100); // empty wallet
      expect(currency.spend(1)).toBe(false);
    });
  });

  // ─── toString ────────────────────────────────────────────────────────────────

  describe('toString', () => {
    it('displays 0G 0S for empty wallet', () => {
      expect(currency.toString()).toBe('0G 0S');
    });

    it('displays only silver when under 100', () => {
      currency.addSilver(47);
      expect(currency.toString()).toBe('0G 47S');
    });

    it('displays gold and silver for 347 silver', () => {
      currency.addSilver(347);
      expect(currency.toString()).toBe('3G 47S');
    });

    it('displays exactly 1G 0S for 100 silver', () => {
      currency.addSilver(100);
      expect(currency.toString()).toBe('1G 0S');
    });

    it('displays large amounts correctly', () => {
      currency.addSilver(999);
      expect(currency.toString()).toBe('9G 99S');
    });
  });
});

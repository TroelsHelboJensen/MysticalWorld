import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencySystem } from '../../js/CurrencySystem.js';

describe('CurrencySystem', () => {
  let wallet;

  beforeEach(() => {
    wallet = new CurrencySystem();
  });

  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('defaults to 0 total silver', () => {
      expect(wallet.totalSilver).toBe(0);
    });

    it('accepts an initial silver amount', () => {
      const w = new CurrencySystem(250);
      expect(w.totalSilver).toBe(250);
    });
  });

  // ─── addSilver ─────────────────────────────────────────────────────────────

  describe('addSilver', () => {
    it('increases totalSilver', () => {
      wallet.addSilver(47);
      expect(wallet.totalSilver).toBe(47);
    });

    it('accumulates across multiple calls', () => {
      wallet.addSilver(30);
      wallet.addSilver(25);
      expect(wallet.totalSilver).toBe(55);
    });
  });

  // ─── addGold ───────────────────────────────────────────────────────────────

  describe('addGold', () => {
    it('adds 100 silver per gold', () => {
      wallet.addGold(3);
      expect(wallet.totalSilver).toBe(300);
    });

    it('can be combined with addSilver', () => {
      wallet.addGold(1);
      wallet.addSilver(47);
      expect(wallet.totalSilver).toBe(147);
    });
  });

  // ─── spend ─────────────────────────────────────────────────────────────────

  describe('spend', () => {
    beforeEach(() => { wallet.addSilver(200); }); // start with 2G

    it('returns true and reduces balance when affordable', () => {
      const result = wallet.spend(50);
      expect(result).toBe(true);
      expect(wallet.totalSilver).toBe(150);
    });

    it('returns false when insufficient funds', () => {
      const result = wallet.spend(201);
      expect(result).toBe(false);
    });

    it('does NOT reduce balance on failure', () => {
      wallet.spend(999);
      expect(wallet.totalSilver).toBe(200);
    });

    it('returns true when spending exact balance', () => {
      expect(wallet.spend(200)).toBe(true);
      expect(wallet.totalSilver).toBe(0);
    });

    it('returns true when spending 0', () => {
      expect(wallet.spend(0)).toBe(true);
      expect(wallet.totalSilver).toBe(200);
    });
  });

  // ─── gold / silver getters ─────────────────────────────────────────────────

  describe('gold and silver getters', () => {
    it('gold returns floor(totalSilver / 100)', () => {
      wallet.addSilver(347);
      expect(wallet.gold).toBe(3);
    });

    it('silver returns remainder after gold', () => {
      wallet.addSilver(347);
      expect(wallet.silver).toBe(47);
    });

    it('exact 100S = 1 gold, 0 silver', () => {
      wallet.addSilver(100);
      expect(wallet.gold).toBe(1);
      expect(wallet.silver).toBe(0);
    });

    it('0 silver = 0 gold, 0 silver', () => {
      expect(wallet.gold).toBe(0);
      expect(wallet.silver).toBe(0);
    });
  });

  // ─── toDisplay ─────────────────────────────────────────────────────────────

  describe('toDisplay', () => {
    it('returns { gold, silver } object', () => {
      wallet.addSilver(347);
      expect(wallet.toDisplay()).toEqual({ gold: 3, silver: 47 });
    });

    it('returns { gold: 0, silver: 0 } when empty', () => {
      expect(wallet.toDisplay()).toEqual({ gold: 0, silver: 0 });
    });
  });

  // ─── toString ──────────────────────────────────────────────────────────────

  describe('toString', () => {
    it('formats as "3G 47S"', () => {
      wallet.addSilver(347);
      expect(wallet.toString()).toBe('3G 47S');
    });

    it('formats "0G 5S" when below 1 gold', () => {
      wallet.addSilver(5);
      expect(wallet.toString()).toBe('0G 5S');
    });

    it('formats "1G 0S" at exactly 100 silver', () => {
      wallet.addSilver(100);
      expect(wallet.toString()).toBe('1G 0S');
    });

    it('formats "0G 0S" when empty', () => {
      expect(wallet.toString()).toBe('0G 0S');
    });
  });
});

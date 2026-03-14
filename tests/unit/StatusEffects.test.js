import { describe, it, expect, beforeEach } from 'vitest';
import { StatusEffects, EffectType, Potion } from '../../characters/StatusEffects.js';
import { HeroState } from '../../characters/HeroState.js';

describe('StatusEffects', () => {
  let fx;
  let hero;

  beforeEach(() => {
    fx   = new StatusEffects();
    hero = new HeroState({ maxHp: 100 });
  });

  // ─── Initial state ──────────────────────────────────────────────────────────

  it('starts with no active effects', () => {
    expect(fx.effects).toHaveLength(0);
  });

  it('has() returns false when no effects active', () => {
    expect(fx.has(EffectType.POISON)).toBe(false);
    expect(fx.has(EffectType.REGEN)).toBe(false);
  });

  // ─── Poison ─────────────────────────────────────────────────────────────────

  describe('applyPoison', () => {
    it('registers a poison effect', () => {
      fx.applyPoison();
      expect(fx.has(EffectType.POISON)).toBe(true);
    });

    it('deals damage at each tick interval', () => {
      fx.applyPoison({ tickDamage: 10, duration: 3000, interval: 1000 });
      fx.update(hero, 1000); // first tick
      expect(hero.hp).toBe(90);
      fx.update(hero, 1000); // second tick
      expect(hero.hp).toBe(80);
    });

    it('expires after the full duration', () => {
      fx.applyPoison({ tickDamage: 5, duration: 2000, interval: 1000 });
      fx.update(hero, 1000); // tick 1 — still active (elapsed 1000 < 2000)
      fx.update(hero, 1000); // tick 2 — expires (elapsed 2000, not < 2000)
      expect(fx.has(EffectType.POISON)).toBe(false);
    });

    it('does not reduce HP below 0', () => {
      hero.takeDamage(95); // hp = 5
      fx.applyPoison({ tickDamage: 10, duration: 3000, interval: 1000 });
      fx.update(hero, 1000);
      expect(hero.hp).toBe(0);
      expect(hero.isDead()).toBe(true);
    });

    it('uses default values when no options given', () => {
      fx.applyPoison();
      const effect = fx.effects[0];
      expect(effect.tickAmount).toBe(5);
      expect(effect.duration).toBe(3000);
      expect(effect.interval).toBe(1000);
    });
  });

  // ─── Regeneration ───────────────────────────────────────────────────────────

  describe('applyRegen', () => {
    it('registers a regen effect', () => {
      fx.applyRegen();
      expect(fx.has(EffectType.REGEN)).toBe(true);
    });

    it('heals at each tick interval', () => {
      hero.takeDamage(50); // hp = 50
      fx.applyRegen({ tickHeal: 10, duration: 5000, interval: 1000 });
      fx.update(hero, 1000);
      expect(hero.hp).toBe(60);
      fx.update(hero, 1000);
      expect(hero.hp).toBe(70);
    });

    it('does not heal above maxHp', () => {
      hero.takeDamage(5); // hp = 95
      fx.applyRegen({ tickHeal: 20, duration: 3000, interval: 1000 });
      fx.update(hero, 1000);
      expect(hero.hp).toBe(100);
    });

    it('expires after the full duration', () => {
      fx.applyRegen({ tickHeal: 5, duration: 2000, interval: 1000 });
      fx.update(hero, 1000);
      fx.update(hero, 1000);
      expect(fx.has(EffectType.REGEN)).toBe(false);
    });

    it('uses default values when no options given', () => {
      fx.applyRegen();
      const effect = fx.effects[0];
      expect(effect.tickAmount).toBe(5);
      expect(effect.duration).toBe(5000);
      expect(effect.interval).toBe(1000);
    });
  });

  // ─── clear ──────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all effects of the given type', () => {
      fx.applyPoison();
      fx.applyRegen();
      fx.clear(EffectType.POISON);
      expect(fx.has(EffectType.POISON)).toBe(false);
      expect(fx.has(EffectType.REGEN)).toBe(true);
    });

    it('does nothing when no effects of that type exist', () => {
      fx.applyRegen();
      expect(() => fx.clear(EffectType.POISON)).not.toThrow();
      expect(fx.has(EffectType.REGEN)).toBe(true);
    });
  });

  // ─── Potions ────────────────────────────────────────────────────────────────

  describe('Potion constants', () => {
    it('SMALL potion heals 20 HP', () => {
      hero.takeDamage(50);
      hero.heal(Potion.SMALL.healAmount);
      expect(hero.hp).toBe(70);
    });

    it('LARGE potion restores full HP', () => {
      hero.takeDamage(90);
      hero.heal(Potion.LARGE.healAmount); // heal(Infinity) clamps to maxHp
      expect(hero.hp).toBe(100);
    });

    it('SMALL potion does not overheal', () => {
      hero.takeDamage(10); // hp = 90
      hero.heal(Potion.SMALL.healAmount); // +20, clamped to 100
      expect(hero.hp).toBe(100);
    });
  });
});

/**
 * StatusEffects — pure JS, no Phaser dependency.
 *
 * Manages timed status effects (poison, regeneration) on any entity that
 * exposes `hp`, `maxHp`, `takeDamage(n)`, and `heal(n)`.
 */

export const EffectType = Object.freeze({
  POISON: 'poison',
  REGEN:  'regen',
});

/**
 * Potion constants.
 * Use with HeroState.heal():
 *   hero.heal(Potion.SMALL.healAmount)   // restore 20 HP
 *   hero.heal(Potion.LARGE.healAmount)   // restore full HP (clamped by heal())
 */
export const Potion = Object.freeze({
  SMALL: { type: 'potion', healAmount: 20 },
  LARGE: { type: 'potion', healAmount: Infinity },
});

export class StatusEffects {
  constructor() {
    /** @type {Array<{type:string, tickAmount:number, duration:number, elapsed:number, interval:number, intervalElapsed:number}>} */
    this.effects = [];
  }

  /**
   * Apply a poison effect. Deals tickDamage every interval ms for duration ms.
   * Multiple calls stack (add a new effect each time).
   * @param {{ tickDamage?: number, duration?: number, interval?: number }} [opts]
   */
  applyPoison(opts = {}) {
    const { tickDamage = 5, duration = 3000, interval = 1000 } = opts;
    this.effects.push({
      type:             EffectType.POISON,
      tickAmount:       tickDamage,
      duration,
      elapsed:          0,
      interval,
      intervalElapsed:  0,
    });
  }

  /**
   * Apply a regeneration effect. Heals tickHeal every interval ms for duration ms.
   * @param {{ tickHeal?: number, duration?: number, interval?: number }} [opts]
   */
  applyRegen(opts = {}) {
    const { tickHeal = 5, duration = 5000, interval = 1000 } = opts;
    this.effects.push({
      type:             EffectType.REGEN,
      tickAmount:       tickHeal,
      duration,
      elapsed:          0,
      interval,
      intervalElapsed:  0,
    });
  }

  /**
   * Advance all active effects by delta milliseconds, applying ticks and
   * expiring effects that have run their full duration.
   *
   * @param {object} target   entity with takeDamage(n) and heal(n)
   * @param {number} delta    milliseconds since last frame
   */
  update(target, delta) {
    this.effects = this.effects.filter(effect => {
      effect.elapsed          += delta;
      effect.intervalElapsed  += delta;

      // Fire tick(s) — handles the case where delta skips multiple intervals
      while (effect.intervalElapsed >= effect.interval) {
        effect.intervalElapsed -= effect.interval;
        if (effect.type === EffectType.POISON) {
          target.takeDamage(effect.tickAmount);
        } else if (effect.type === EffectType.REGEN) {
          target.heal(effect.tickAmount);
        }
      }

      // Keep effect if it hasn't expired
      return effect.elapsed < effect.duration;
    });
  }

  /**
   * Remove all active effects of the given type.
   * @param {string} type  EffectType.POISON or EffectType.REGEN
   */
  clear(type) {
    this.effects = this.effects.filter(e => e.type !== type);
  }

  /**
   * Returns true if at least one effect of the given type is active.
   * @param {string} type
   */
  has(type) {
    return this.effects.some(e => e.type === type);
  }
}

/**
 * CombatCalculator — pure JS, no Phaser dependency.
 *
 * Damage formula:  max(1, attacker.attack - defender.defense)
 * Crit:            10% chance, 1.5× multiplier (result floored)
 */
export class CombatCalculator {
  static CRIT_CHANCE     = 0.1;
  static CRIT_MULTIPLIER = 1.5;

  /**
   * Calculate damage dealt by attacker to defender.
   * Uses Math.random() internally — use calcDamageWithRandom() in tests.
   *
   * @param {{ attack: number }}  attacker
   * @param {{ defense: number }} defender
   * @returns {{ damage: number, isCrit: boolean }}
   */
  static calcDamage(attacker, defender) {
    return CombatCalculator.calcDamageWithRandom(attacker, defender, Math.random());
  }

  /**
   * Deterministic version of calcDamage — accepts an explicit random value.
   * A random value below CRIT_CHANCE triggers a critical hit.
   *
   * @param {{ attack: number }}  attacker
   * @param {{ defense: number }} defender
   * @param {number}              random   value in [0, 1)
   * @returns {{ damage: number, isCrit: boolean }}
   */
  static calcDamageWithRandom(attacker, defender, random) {
    const base   = Math.max(1, attacker.attack - defender.defense);
    const isCrit = random < CombatCalculator.CRIT_CHANCE;
    const damage = isCrit
      ? Math.floor(base * CombatCalculator.CRIT_MULTIPLIER)
      : base;

    return { damage, isCrit };
  }
}

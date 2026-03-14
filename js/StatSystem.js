export class StatSystem {
  /**
   * Calculate effective stats by adding all equipped item bonuses to baseStats.
   *
   * @param {{ attack: number, defense: number, speed: number, maxHp: number }} baseStats
   * @param {{ weapon: object|null, shield: object|null, armor: object|null, accessory: object|null }} equipped
   * @returns {{ attack: number, defense: number, speed: number, maxHp: number }}
   */
  static calculate(baseStats, equipped) {
    const result = { ...baseStats };

    for (const item of Object.values(equipped)) {
      if (!item?.stats) continue;
      for (const [stat, bonus] of Object.entries(item.stats)) {
        if (stat in result) {
          result[stat] += bonus;
        }
      }
    }

    return result;
  }
}

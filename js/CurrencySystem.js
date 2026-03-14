/**
 * CurrencySystem — pure JS, no Phaser dependency.
 *
 * Stores the player's wealth internally as a single silver total.
 * 100 silver = 1 gold. Display format: "3G 47S".
 */
export class CurrencySystem {
  /**
   * @param {number} [initialSilver=0]
   */
  constructor(initialSilver = 0) {
    this.totalSilver = initialSilver;
  }

  // ─── Computed properties ───────────────────────────────────────────────────

  /** Whole gold units. */
  get gold() {
    return Math.floor(this.totalSilver / 100);
  }

  /** Remaining silver after gold is extracted. */
  get silver() {
    return this.totalSilver % 100;
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Add silver coins.
   * @param {number} amount  must be a non-negative integer
   */
  addSilver(amount) {
    this.totalSilver += amount;
  }

  /**
   * Add gold coins (1 gold = 100 silver).
   * @param {number} amount  must be a non-negative integer
   */
  addGold(amount) {
    this.totalSilver += amount * 100;
  }

  /**
   * Spend silver. Returns true if the purchase succeeded, false if the player
   * cannot afford it. The balance is never reduced below zero.
   *
   * @param {number} silverAmount
   * @returns {boolean}
   */
  spend(silverAmount) {
    if (silverAmount > this.totalSilver) return false;
    this.totalSilver -= silverAmount;
    return true;
  }

  // ─── Display ───────────────────────────────────────────────────────────────

  /**
   * Returns the wallet split into gold and silver components.
   * @returns {{ gold: number, silver: number }}
   */
  toDisplay() {
    return { gold: this.gold, silver: this.silver };
  }

  /**
   * Human-readable string, e.g. "3G 47S" or "0G 5S".
   * @returns {string}
   */
  toString() {
    return `${this.gold}G ${this.silver}S`;
  }
}

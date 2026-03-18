/**
 * HUDState – pure JS helper that computes what the HUD should display.
 * No Phaser dependency — used by unit tests and consumed by HUD.js.
 */
export class HUDState {
  /**
   * @param {{ heroState, currency?, inventory? }} deps
   */
  constructor({ heroState, currency = null, inventory = null }) {
    this._hero      = heroState;
    this._currency  = currency;
    this._inventory = inventory;
  }

  /**
   * Returns a plain snapshot object for rendering.
   * @returns {{ hp: number, maxHp: number, hpRatio: number, purse: string, weapon: string }}
   */
  snapshot() {
    const hp    = this._hero.hp;
    const maxHp = this._hero.maxHp;
    const hpRatio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;

    const purse  = this._currency  ? this._currency.toString()             : '0G 0S';
    const weapon = this._inventory ? this._inventory.getEquipped('weapon') : null;

    return {
      hp,
      maxHp,
      hpRatio,
      purse,
      weapon: weapon ? weapon.name : '—',
    };
  }
}

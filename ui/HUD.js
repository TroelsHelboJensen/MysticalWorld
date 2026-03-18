/**
 * HUD – Phaser scene overlay that renders the heads-up display.
 *
 * Shows:
 *   • HP bar (filled / depleted segments, numeric label)
 *   • Purse (currency string)
 *   • Equipped weapon name (or "—" if none)
 *
 * Launch as a persistent parallel scene from GameScene:
 *   this.scene.launch('HUD', { heroState, currency, inventory })
 *
 * Refresh each frame by calling update() or by subscribing to game events.
 */
export class HUD extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  /** @param {{ heroState, currency, inventory }} data */
  init(data) {
    this._hero      = data.heroState;
    this._currency  = data.currency;
    this._inventory = data.inventory;
  }

  create() {
    const PAD = 10;

    // ── HP bar ───────────────────────────────────────────────────────────────
    const BAR_W = 120;
    const BAR_H = 14;

    this.add.text(PAD, PAD, 'HP', {
      fontSize: '12px', color: '#ffffff',
    });

    // Background (depleted)
    this._hpBg = this.add.rectangle(PAD + 22, PAD + 3, BAR_W, BAR_H, 0x440000)
      .setOrigin(0, 0);

    // Foreground (filled) – we'll resize this each frame
    this._hpFill = this.add.rectangle(PAD + 22, PAD + 3, BAR_W, BAR_H, 0xdd2222)
      .setOrigin(0, 0);

    // Numeric label
    this._hpText = this.add.text(PAD + 22 + BAR_W + 6, PAD, '', {
      fontSize: '12px', color: '#ffffff',
    });

    // ── Purse ────────────────────────────────────────────────────────────────
    this._purseText = this.add.text(PAD, PAD + 22, '', {
      fontSize: '12px', color: '#ffe066',
    });

    // ── Equipped weapon ──────────────────────────────────────────────────────
    this._weaponText = this.add.text(PAD, PAD + 38, '', {
      fontSize: '12px', color: '#aaddff',
    });

    this._refresh();
  }

  update() {
    this._refresh();
  }

  // ── private ──────────────────────────────────────────────────────────────

  _refresh() {
    if (!this._hero) return;

    // HP bar
    const ratio   = this._hero.maxHp > 0
      ? Math.max(0, this._hero.hp / this._hero.maxHp)
      : 0;
    const BAR_W   = 120;
    this._hpFill.width = Math.round(BAR_W * ratio);
    this._hpText.setText(`${this._hero.hp}/${this._hero.maxHp}`);

    // Purse
    if (this._currency) {
      this._purseText.setText(`\u2666 ${this._currency.toString()}`);
    }

    // Equipped weapon
    if (this._inventory) {
      const weapon = this._inventory.getEquipped('weapon');
      this._weaponText.setText(`\u2694 ${weapon ? weapon.name : '\u2014'}`);
    }
  }
}

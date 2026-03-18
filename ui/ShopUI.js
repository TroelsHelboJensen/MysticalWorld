/**
 * ShopUI – Phaser scene overlay for the vendor shop.
 *
 * Launch with:  this.scene.launch('ShopUI', { shop, currency, inventory })
 * Close with:   this.scene.stop('ShopUI')  (or press Escape)
 *
 * Displays catalogue items with buy buttons and shows the player's
 * current purse. Selection feedback is provided via text colour.
 */
export class ShopUI extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopUI' });
  }

  /** @param {{ shop, currency, inventory }} data */
  init(data) {
    this._shop      = data.shop;
    this._currency  = data.currency;
    this._inventory = data.inventory;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Semi-transparent backdrop
    this.add.rectangle(W / 2, H / 2, W * 0.6, H * 0.7, 0x000000, 0.85)
      .setOrigin(0.5);

    this.add.text(W / 2, H * 0.18, 'SHOP', {
      fontSize: '24px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);

    this._purseText = this.add.text(W / 2, H * 0.24, '', {
      fontSize: '14px', color: '#aaffaa',
    }).setOrigin(0.5);

    this._statusText = this.add.text(W / 2, H * 0.78, '', {
      fontSize: '13px', color: '#ffaaaa',
    }).setOrigin(0.5);

    this._renderCatalogue();
    this._refreshPurse();

    // Close on Escape
    this._escKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC,
    );
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this._escKey)) {
      this.scene.stop();
    }
  }

  // ── private ──────────────────────────────────────────────────────────────

  _renderCatalogue() {
    const W  = this.scale.width;
    const startY = this.scale.height * 0.32;
    const rowH   = 44;

    this._shop.catalogue.forEach((entry, i) => {
      const y = startY + i * rowH;

      this.add.text(W * 0.28, y, entry.name, {
        fontSize: '14px', color: '#ffffff',
      }).setOrigin(0, 0.5);

      this.add.text(W * 0.62, y, `${entry.price}S`, {
        fontSize: '14px', color: '#ffe066',
      }).setOrigin(0.5);

      const btn = this.add.text(W * 0.72, y, '[Buy]', {
        fontSize: '14px', color: '#66aaff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#ffffff'));
      btn.on('pointerout',  () => btn.setColor('#66aaff'));
      btn.on('pointerdown', () => this._onBuy(entry.id));
    });
  }

  _onBuy(id) {
    const result = this._shop.buy(id, this._currency, this._inventory);
    const messages = {
      ok:                 'Purchased!',
      not_found:          'Item not found.',
      insufficient_funds: 'Not enough silver!',
      inventory_full:     'Inventory is full!',
    };
    this._statusText.setText(messages[result] ?? result);
    this._refreshPurse();
  }

  _refreshPurse() {
    this._purseText.setText(`Purse: ${this._currency.toString()}`);
  }
}

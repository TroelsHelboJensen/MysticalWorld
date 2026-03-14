import { DialogueSystem } from './DialogueSystem.js';

/**
 * DialogueBox — Phaser.Scene overlay
 *
 * Thin rendering layer for the dialogue system.
 * Receives a pre-populated DialogueSystem via init(data).
 * Pauses hero movement while open (handled by scene lifecycle).
 */
export class DialogueBox extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueBox' });
  }

  /**
   * @param {{ dialogueSystem: DialogueSystem, npcId: string }} data
   */
  init(data) {
    /** @type {DialogueSystem} */
    this.dialogueSystem = data.dialogueSystem;
    this.npcId          = data.npcId;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Semi-transparent dark background box at the bottom of the screen
    this._bg = this.add.rectangle(W / 2, H - 60, W - 32, 120, 0x000000, 0.75)
      .setOrigin(0.5, 0.5);

    // Text element
    this._text = this.add.text(24, H - 114, '', {
      fontSize: '14px',
      color:    '#ffffff',
      wordWrap: { width: W - 80 },
    });

    // Option labels (up to 4)
    this._optionTexts = [];
    for (let i = 0; i < 4; i++) {
      this._optionTexts.push(
        this.add.text(24 + i * 120, H - 30, '', {
          fontSize: '12px',
          color:    '#ffff88',
        }).setVisible(false)
      );
    }

    // Advance prompt
    this._prompt = this.add.text(W - 48, H - 24, '▶', {
      fontSize: '12px',
      color:    '#aaaaaa',
    });

    // Input
    this._keys = this.input.keyboard.addKeys({
      advance: Phaser.Input.Keyboard.KeyCodes.E,
      space:   Phaser.Input.Keyboard.KeyCodes.SPACE,
      escape:  Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    // Start the dialogue
    const page = this.dialogueSystem.start(this.npcId);
    if (page) this._showPage(page);
    else this._close();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this._keys.escape)) {
      this._close();
      return;
    }

    if (
      Phaser.Input.Keyboard.JustDown(this._keys.advance) ||
      Phaser.Input.Keyboard.JustDown(this._keys.space)
    ) {
      const page = this.dialogueSystem.next();
      if (page) this._showPage(page);
      else this._close();
    }
  }

  _showPage(page) {
    this._text.setText(page.text);
    this._optionTexts.forEach((t, i) => {
      if (i < page.options.length) {
        t.setText(`[${i + 1}] ${page.options[i]}`).setVisible(true);
      } else {
        t.setVisible(false);
      }
    });
  }

  _close() {
    this.dialogueSystem.close();
    this.scene.stop();
  }
}

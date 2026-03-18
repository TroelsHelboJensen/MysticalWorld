import { HeroState, Direction } from './HeroState.js';

/**
 * Hero — Phaser.GameObjects.Sprite
 *
 * Thin rendering/input wrapper. All state lives in HeroState; this class
 * reads keyboard input, delegates to HeroState, then syncs the sprite.
 *
 * Spritesheet layout (each frame 32×32, 4 columns per row):
 *   Row 0 — idle:  down, up, left, right
 *   Row 1 — walk:  down (4 frames)
 *   Row 2 — walk:  up   (4 frames)
 *   Row 3 — walk:  left (4 frames)
 *   Row 4 — walk:  right(4 frames)
 *   Row 5 — sword: down (4 frames)
 *   Row 6 — sword: up   (4 frames)
 *   Row 7 — sword: left (4 frames)
 *   Row 8 — sword: right(4 frames)
 */
export class Hero extends Phaser.GameObjects.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  initial world X
   * @param {number} y  initial world Y
   * @param {import('../maps/MapManager.js').MapManager} mapManager
   */
  constructor(scene, x, y, mapManager) {
    super(scene, x, y, 'hero');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.75);              // 32px sprite → 24px on screen

    /** @type {Phaser.Physics.Arcade.Body} */
    this.body.setSize(20, 20);        // hitbox scaled to match display size
    this.body.setOffset(6, 10);

    this.mapManager = mapManager;
    this.state = new HeroState({ x, y });

    this._isAttacking = false;
    this._attackTimer = null;

    this._setupAnimations();
    this._setupInput();
  }

  // ─── Phaser lifecycle ──────────────────────────────────────────────────────

  update(time, delta) {
    this.state.tickInvincibility(delta);

    if (this._isAttacking) return; // lock movement during swing

    const dt = delta / 1000; // seconds
    this._handleMovement(dt);
    this._handleAttack();
    this._syncSprite();
  }

  /**
   * Apply damage to the hero, respecting invincibility frames.
   * Ignored silently if the hero is currently invincible.
   * Otherwise applies damage and starts an 800ms i-frame window with a
   * flashing sprite effect.
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.state.isInvincible) return;

    this.state.takeDamage(amount);
    this.state.startInvincibility(800);

    this.scene.tweens.add({
      targets:    this,
      alpha:      0,
      duration:   100,
      yoyo:       true,
      repeat:     3,
      onComplete: () => { this.alpha = 1; },
    });
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  _setupInput() {
    const kb = this.scene.input.keyboard;
    this._keys = {
      up:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w:      kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a:      kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s:      kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d:      kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      z:      kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
    };
  }

  // ─── Movement ──────────────────────────────────────────────────────────────

  _handleMovement(dt) {
    const k = this._keys;
    let dx = 0;
    let dy = 0;

    if (k.left.isDown  || k.a.isDown)  dx = -1;
    if (k.right.isDown || k.d.isDown)  dx =  1;
    if (k.up.isDown    || k.w.isDown)  dy = -1;
    if (k.down.isDown  || k.s.isDown)  dy =  1;

    // Normalise diagonal so speed stays constant
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    const speed   = this.state.speed;
    const rawNewX = this.state.x + dx * speed * dt;
    const rawNewY = this.state.y + dy * speed * dt;

    // Resolve collision: try each axis independently so the hero can slide
    // along walls instead of stopping dead.
    const resolvedX = this._resolveAxis(rawNewX, this.state.y, true);
    const resolvedY = this._resolveAxis(resolvedX, rawNewY, false);

    // Clamp to map bounds
    const halfW = this.displayWidth  / 2;
    const halfH = this.displayHeight / 2;
    const clampedX = Phaser.Math.Clamp(resolvedX,  halfW, this.mapManager.mapWidthPx  - halfW);
    const clampedY = Phaser.Math.Clamp(resolvedY, halfH, this.mapManager.mapHeightPx - halfH);

    this.state.move(dx, dy, clampedX, clampedY);
    this.body.reset(clampedX, clampedY);
  }

  /**
   * Returns the resolved position for one axis after collision check.
   * Tests four corners of the hitbox.
   */
  _resolveAxis(x, y, horizontal) {
    const hw = 12; // half of hitbox width  (24/2)
    const hh = 12; // half of hitbox height (24/2)
    const offY = 8; // body.offset.y centres the hitbox lower on the sprite

    const corners = [
      { cx: x - hw, cy: y - hh + offY },
      { cx: x + hw, cy: y - hh + offY },
      { cx: x - hw, cy: y + hh + offY },
      { cx: x + hw, cy: y + hh + offY },
    ];

    for (const { cx, cy } of corners) {
      if (this.mapManager.isBlockedAt(cx, cy)) {
        return horizontal ? this.state.x : this.state.y; // revert this axis
      }
    }
    return horizontal ? x : y;
  }

  // ─── Attack ────────────────────────────────────────────────────────────────

  _handleAttack() {
    const attack = Phaser.Input.Keyboard.JustDown(this._keys.space) ||
                   Phaser.Input.Keyboard.JustDown(this._keys.z);
    if (!attack) return;

    this._isAttacking = true;
    this.play(`sword-${this.state.direction}`, true);

    this._attackTimer = this.scene.time.delayedCall(300, () => {
      this._isAttacking = false;
    });
  }

  // ─── Sprite sync ──────────────────────────────────────────────────────────

  _syncSprite() {
    this.x = this.state.x;
    this.y = this.state.y;

    const dir = this.state.direction;
    if (this.state.isMoving) {
      this.play(`walk-${dir}`, true);
    } else {
      this.play(`idle-${dir}`, true);
    }
  }

  // ─── Animations ───────────────────────────────────────────────────────────

  _setupAnimations() {
    const anims = this.scene.anims;

    // Helper: only create if not already registered (scene may recreate hero)
    const make = (key, frames, frameRate, repeat) => {
      if (!anims.exists(key)) {
        anims.create({ key, frames, frameRate, repeat });
      }
    };

    // Idle — single frame per direction (row 0, frames 0-3)
    make(`idle-${Direction.DOWN}`,  [{ key: 'hero', frame: 0 }], 1, -1);
    make(`idle-${Direction.UP}`,    [{ key: 'hero', frame: 1 }], 1, -1);
    make(`idle-${Direction.LEFT}`,  [{ key: 'hero', frame: 2 }], 1, -1);
    make(`idle-${Direction.RIGHT}`, [{ key: 'hero', frame: 3 }], 1, -1);

    // Walk — 4 frames each, rows 1-4 (frames 4-19)
    make(`walk-${Direction.DOWN}`,  this.scene.anims.generateFrameNumbers('hero', { start:  4, end:  7 }), 8, -1);
    make(`walk-${Direction.UP}`,    this.scene.anims.generateFrameNumbers('hero', { start:  8, end: 11 }), 8, -1);
    make(`walk-${Direction.LEFT}`,  this.scene.anims.generateFrameNumbers('hero', { start: 12, end: 15 }), 8, -1);
    make(`walk-${Direction.RIGHT}`, this.scene.anims.generateFrameNumbers('hero', { start: 16, end: 19 }), 8, -1);

    // Sword swing — 4 frames each, rows 5-8 (frames 20-35)
    make(`sword-${Direction.DOWN}`,  this.scene.anims.generateFrameNumbers('hero', { start: 20, end: 23 }), 12, 0);
    make(`sword-${Direction.UP}`,    this.scene.anims.generateFrameNumbers('hero', { start: 24, end: 27 }), 12, 0);
    make(`sword-${Direction.LEFT}`,  this.scene.anims.generateFrameNumbers('hero', { start: 28, end: 31 }), 12, 0);
    make(`sword-${Direction.RIGHT}`, this.scene.anims.generateFrameNumbers('hero', { start: 32, end: 35 }), 12, 0);
  }
}

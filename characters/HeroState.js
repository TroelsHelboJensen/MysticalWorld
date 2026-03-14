/**
 * HeroState — pure JS, no Phaser dependency.
 *
 * Owns all hero data: position, direction, movement speed, HP and base stats.
 * The Phaser Hero sprite reads from / writes to this class; it never contains
 * game logic itself.
 */

export const Direction = Object.freeze({
  DOWN:  'down',
  UP:    'up',
  LEFT:  'left',
  RIGHT: 'right',
});

export class HeroState {
  /**
   * @param {object} [opts]
   * @param {number} [opts.x=100]
   * @param {number} [opts.y=100]
   * @param {number} [opts.speed=160]   pixels per second
   * @param {number} [opts.maxHp=100]
   */
  constructor({ x = 100, y = 100, speed = 160, maxHp = 100 } = {}) {
    // Position
    this.x = x;
    this.y = y;

    // Movement
    this.speed = speed;
    this.direction = Direction.DOWN;
    this.isMoving = false;

    // Health
    this.maxHp = maxHp;
    this.hp    = maxHp;

    // Base stats (modified by equipment in Phase 9)
    this.attack  = 10;
    this.defense = 5;

    // Inventory reference — set by InventoryManager in Phase 9
    this.inventory = null;

    // Invincibility frames (set by takeDamage flow in Hero.js)
    this.isInvincible          = false;
    this._invincibilityRemaining = 0;
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  /**
   * Reduce HP by amount, clamped to 0.
   * @param {number} amount  must be positive
   */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  /**
   * Restore HP by amount, clamped to maxHp.
   * @param {number} amount  must be positive
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** Returns true when hp reaches 0. */
  isDead() {
    return this.hp === 0;
  }

  /**
   * Increase the max HP pool and optionally top up current HP by the same delta.
   * @param {number} amount
   * @param {boolean} [healOnIncrease=true]
   */
  increaseMaxHp(amount, healOnIncrease = true) {
    this.maxHp += amount;
    if (healOnIncrease) this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  // ─── Invincibility ─────────────────────────────────────────────────────────

  /**
   * Begin an invincibility window of durationMs milliseconds.
   * While active, Hero.js should skip incoming damage.
   * @param {number} [durationMs=800]
   */
  startInvincibility(durationMs = 800) {
    this.isInvincible            = true;
    this._invincibilityRemaining = durationMs;
  }

  /**
   * Advance the invincibility timer. Call every frame from Hero.js update().
   * @param {number} delta  milliseconds since last frame
   */
  tickInvincibility(delta) {
    if (!this.isInvincible) return;
    this._invincibilityRemaining -= delta;
    if (this._invincibilityRemaining <= 0) {
      this.isInvincible            = false;
      this._invincibilityRemaining = 0;
    }
  }

  // ─── Movement ──────────────────────────────────────────────────────────────

  /**
   * Update position and facing direction based on an input vector.
   * Caller is responsible for collision — pass the post-collision position.
   *
   * @param {number} dx         horizontal delta (pixels this frame)
   * @param {number} dy         vertical delta (pixels this frame)
   * @param {number} newX       resolved world X after collision
   * @param {number} newY       resolved world Y after collision
   */
  move(dx, dy, newX, newY) {
    this.x = newX;
    this.y = newY;
    this.isMoving = dx !== 0 || dy !== 0;

    // Direction is determined by the dominant axis; horizontal wins ties.
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx > 0) this.direction = Direction.RIGHT;
      else if (dx < 0) this.direction = Direction.LEFT;
    } else {
      if (dy > 0) this.direction = Direction.DOWN;
      else if (dy < 0) this.direction = Direction.UP;
    }
  }

  /** Convenience: snap position without changing direction or moving flag. */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
}

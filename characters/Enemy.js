import { EnemyAIState } from './EnemyState.js';

/**
 * Enemy — Phaser.GameObjects.Sprite
 *
 * Thin rendering wrapper around EnemyState.
 * All game logic lives in EnemyState; this class only handles
 * sprite positioning and delegates everything else to the state object.
 */
export class Enemy extends Phaser.GameObjects.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number}       x          initial world X
   * @param {number}       y          initial world Y
   * @param {import('./EnemyState.js').EnemyState} enemyState
   */
  constructor(scene, x, y, enemyState) {
    super(scene, x, y, 'enemy');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    /** @type {import('./EnemyState.js').EnemyState} */
    this.state = enemyState;

    /** @type {Phaser.Physics.Arcade.Body} */
    this.body.setSize(24, 24);
  }

  // ─── Phaser lifecycle ──────────────────────────────────────────────────────

  /**
   * Called every frame by the scene.
   * Ticks the AI state machine and moves the sprite to match state position.
   *
   * @param {number} time   Phaser timestamp (ms)
   * @param {number} delta  ms since last frame
   * @param {number} heroX  hero world X
   * @param {number} heroY  hero world Y
   */
  update(time, delta, heroX, heroY) {
    const aiState = this.state.tick(heroX, heroY, delta);

    if (aiState === EnemyAIState.DEAD) {
      this.destroy();
      return;
    }

    // Sync sprite position to state (state.tick() already moved the position
    // when in CHASE state)
    this.x = this.state.x;
    this.y = this.state.y;

    if (this.body) {
      this.body.reset(this.x, this.y);
    }
  }

  // ─── Combat ───────────────────────────────────────────────────────────────

  /**
   * Apply damage to this enemy.
   * Destroys the sprite if the enemy dies.
   *
   * @param {number} amount
   */
  takeDamage(amount) {
    this.state.takeDamage(amount);

    if (this.state.isDead()) {
      this.destroy();
    }
  }
}

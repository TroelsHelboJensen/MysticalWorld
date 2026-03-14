/**
 * EnemyState — pure JS, no Phaser dependency.
 *
 * Owns all enemy data: position, stats, AI state machine.
 * The Phaser Enemy sprite reads from / writes to this class.
 */

export const EnemyAIState = Object.freeze({
  IDLE:    'idle',
  PATROL:  'patrol',
  CHASE:   'chase',
  ATTACK:  'attack',
  DEAD:    'dead',
});

export class EnemyState {
  /**
   * @param {object} [opts]
   * @param {number} [opts.x=0]
   * @param {number} [opts.y=0]
   * @param {number} [opts.hp=10]
   * @param {number} [opts.maxHp=10]
   * @param {number} [opts.attack=5]
   * @param {number} [opts.defense=0]
   * @param {number} [opts.speed=60]           pixels per second
   * @param {number} [opts.detectionRange=150]  pixels — hero must be within this to trigger CHASE
   * @param {number} [opts.attackRange=32]      pixels — hero must be within this to trigger ATTACK
   * @param {Array}  [opts.dropTable=[]]        array of { type, amount, chance }
   */
  constructor({
    x              = 0,
    y              = 0,
    hp             = 10,
    maxHp          = 10,
    attack         = 5,
    defense        = 0,
    speed          = 60,
    detectionRange = 150,
    attackRange    = 32,
    dropTable      = [],
  } = {}) {
    this.x              = x;
    this.y              = y;
    this.hp             = hp;
    this.maxHp          = maxHp;
    this.attack         = attack;
    this.defense        = defense;
    this.speed          = speed;
    this.detectionRange = detectionRange;
    this.attackRange    = attackRange;
    this.dropTable      = dropTable;

    this.aiState = EnemyAIState.IDLE;
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  /**
   * Reduce HP by amount, clamped to 0.
   * @param {number} amount  must be positive
   */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  /** Returns true when hp reaches 0. */
  isDead() {
    return this.hp === 0;
  }

  // ─── AI tick ──────────────────────────────────────────────────────────────

  /**
   * Advance the AI state machine by one frame.
   * Updates this.aiState and this.x / this.y when chasing.
   *
   * Rules:
   *   isDead()                                     → DEAD (stays dead)
   *   distance > detectionRange                    → IDLE
   *   distance <= detectionRange && > attackRange  → CHASE (moves toward hero)
   *   distance <= attackRange                      → ATTACK
   *
   * @param {number} heroX   hero world X
   * @param {number} heroY   hero world Y
   * @param {number} delta   milliseconds since last frame
   * @returns {string}  the new EnemyAIState value
   */
  tick(heroX, heroY, delta) {
    if (this.isDead()) {
      this.aiState = EnemyAIState.DEAD;
      return this.aiState;
    }

    const dx       = heroX - this.x;
    const dy       = heroY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.attackRange) {
      this.aiState = EnemyAIState.ATTACK;
    } else if (distance <= this.detectionRange) {
      this.aiState = EnemyAIState.CHASE;

      // Move toward hero
      const dt  = delta / 1000; // seconds
      const len = distance || 1; // avoid division by zero
      this.x   += (dx / len) * this.speed * dt;
      this.y   += (dy / len) * this.speed * dt;
    } else {
      this.aiState = EnemyAIState.IDLE;
    }

    return this.aiState;
  }

  // ─── Drops ────────────────────────────────────────────────────────────────

  /**
   * Roll against the drop table and return the items that dropped this run.
   * Each entry in dropTable has { type, amount, chance }.
   * Uses Math.random() internally.
   *
   * @returns {Array<{ type: string, amount: number }>}
   */
  generateDrops() {
    return this.dropTable
      .filter(entry => Math.random() < entry.chance)
      .map(({ type, amount }) => ({ type, amount }));
  }
}

// ─── Preset factory functions ──────────────────────────────────────────────

/**
 * Creates a Slime enemy — weak, slow, always drops a small amount of silver.
 * @param {number} x
 * @param {number} y
 * @returns {EnemyState}
 */
export function createSlime(x, y) {
  return new EnemyState({
    x,
    y,
    hp:             15,
    maxHp:          15,
    attack:         4,
    defense:        0,
    speed:          50,
    dropTable: [
      { type: 'silver', amount: 3,  chance: 1.0 },
      { type: 'silver', amount: 10, chance: 0.2 },
    ],
  });
}

/**
 * Creates a Darknut enemy — heavily armored knight, hard to kill.
 * @param {number} x
 * @param {number} y
 * @returns {EnemyState}
 */
export function createDarknut(x, y) {
  return new EnemyState({
    x,
    y,
    hp:             40,
    maxHp:          40,
    attack:         12,
    defense:        8,
    speed:          70,
    dropTable: [
      { type: 'gold',   amount: 1,  chance: 0.5  },
      { type: 'silver', amount: 20, chance: 1.0  },
    ],
  });
}

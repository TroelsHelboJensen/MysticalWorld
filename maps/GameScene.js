import { MapManager }       from './MapManager.js';
import { Hero }              from '../characters/Hero.js';
import { Enemy }             from '../characters/Enemy.js';
import { createSlime, createDarknut } from '../characters/EnemyState.js';
import { CurrencySystem }    from '../js/CurrencySystem.js';
import { InventoryManager }  from '../js/InventoryManager.js';
import { CombatCalculator }  from '../js/CombatCalculator.js';
import { SaveManager }       from '../persistence/SaveManager.js';

/**
 * GameScene — Phaser.Scene responsible for rendering the tilemap, spawning
 * the hero, enemies and managing the camera.
 *
 * Wires together:
 *   - Hero (movement, attack, i-frames)
 *   - Enemies (AI chase/attack)
 *   - CurrencySystem  (silver drops)
 *   - InventoryManager (item slots)
 *   - CombatCalculator (damage formula)
 *   - SaveManager (F5 quick-save / F9 quick-load)
 *   - HUD scene (launched as parallel overlay)
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.mapManager  = null;
    this.tilemap     = null;
    this.hero        = null;
    this._enemies    = [];   // array of Enemy sprites
    this.currency    = null;
    this.inventory   = null;
    this.saveManager = null;
  }

  // ─── Preload ───────────────────────────────────────────────────────────────

  preload() {
    this.load.image('tiles-overworld', 'assets/tilesets/overworld.png');
    this.load.tilemapTiledJSON('map-overworld', 'maps/overworld.json');
    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  create() {
    // ── Tilemap ──────────────────────────────────────────────────────────────
    const cache = this.cache.tilemap.get('map-overworld');
    this.mapManager = new MapManager(cache.data);

    this.tilemap = this.make.tilemap({ key: 'map-overworld' });
    const tileset = this.tilemap.addTilesetImage('overworld', 'tiles-overworld');

    this.tilemap.createLayer('Ground',   tileset, 0, 0);
    this.tilemap.createLayer('Details',  tileset, 0, 0);

    const collisionLayer = this.tilemap.createLayer('Collision', tileset, 0, 0);
    collisionLayer.setVisible(false);
    collisionLayer.setCollisionByExclusion([0]);

    // ── Systems ──────────────────────────────────────────────────────────────
    this.currency    = new CurrencySystem(100);   // start with 100S
    this.inventory   = new InventoryManager();
    this.saveManager = new SaveManager();

    // ── Hero ─────────────────────────────────────────────────────────────────
    const spawnX = this.mapManager.mapWidthPx  / 2;
    const spawnY = this.mapManager.mapHeightPx / 2;
    this.hero = new Hero(this, spawnX, spawnY, this.mapManager);
    this.hero.state.inventory = this.inventory;   // attach inventory to hero state

    // Camera — zoom 1.5× so 32px tiles fill the screen at a readable pixel-art scale
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBounds(
      0, 0,
      this.mapManager.mapWidthPx,
      this.mapManager.mapHeightPx,
    );
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    // ── Enemy placeholder texture (red square) ───────────────────────────────
    if (!this.textures.exists('enemy')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xcc2222);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xff6666);
      g.fillRect(8, 6, 16, 10);   // "face" highlight
      g.generateTexture('enemy', 32, 32);
      g.destroy();
    }

    // ── Enemies ──────────────────────────────────────────────────────────────
    this._spawnEnemies();

    // ── Physics overlaps ─────────────────────────────────────────────────────
    // Enemy touches hero → hero takes damage (once per 800ms i-frame window)
    this._enemyGroup = this.physics.add.group(this._enemies);
    this.physics.add.overlap(this.hero, this._enemyGroup, (hero, enemySprite) => {
      if (enemySprite.state.aiState === 'attack') {
        hero.takeDamage(enemySprite.state.attack);
      }
    });

    // ── Save / Load hotkeys ──────────────────────────────────────────────────
    this._f5Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F5);
    this._f9Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F9);

    // ── Attack keys (for dealing damage to enemies) ──────────────────────────
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._zKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // ── HUD (parallel scene overlay) ─────────────────────────────────────────
    this.scene.launch('HUD', {
      heroState: this.hero.state,
      currency:  this.currency,
      inventory: this.inventory,
    });

    // ── Loading screen ───────────────────────────────────────────────────────
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.hero) return;

    // Hero
    this.hero.update(time, delta);

    // Hero sword swing → hit nearby enemies
    const attacking = Phaser.Input.Keyboard.JustDown(this._spaceKey) ||
                      Phaser.Input.Keyboard.JustDown(this._zKey);
    if (attacking) {
      this._heroAttackEnemies();
    }

    // Tick enemies; prune dead ones
    for (let i = this._enemies.length - 1; i >= 0; i--) {
      const e = this._enemies[i];
      if (!e.active) {
        this._enemies.splice(i, 1);
      } else {
        e.update(time, delta, this.hero.x, this.hero.y);
      }
    }

    // Quick save / load
    if (Phaser.Input.Keyboard.JustDown(this._f5Key)) this._quickSave();
    if (Phaser.Input.Keyboard.JustDown(this._f9Key)) this._quickLoad();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  _spawnEnemies() {
    const W = this.mapManager.mapWidthPx;
    const H = this.mapManager.mapHeightPx;

    const spawns = [
      { factory: createSlime,   x: W * 0.3, y: H * 0.3 },
      { factory: createSlime,   x: W * 0.7, y: H * 0.3 },
      { factory: createSlime,   x: W * 0.3, y: H * 0.7 },
      { factory: createDarknut, x: W * 0.7, y: H * 0.7 },
    ];

    for (const { factory, x, y } of spawns) {
      const state  = factory(x, y);
      const sprite = new Enemy(this, x, y, state);
      this._enemies.push(sprite);
    }
  }

  /** When the hero swings a sword, damage enemies within melee range. */
  _heroAttackEnemies() {
    const MELEE_RANGE = 48; // pixels

    for (const e of this._enemies) {
      if (!e.active) continue;
      const dx   = e.x - this.hero.x;
      const dy   = e.y - this.hero.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= MELEE_RANGE) {
        const { damage } = CombatCalculator.calcDamage(this.hero.state, e.state);
        e.takeDamage(damage);
        if (e.state.isDead()) {
          // Drop silver from enemy's drop table
          const drops = e.state.generateDrops();
          for (const drop of drops) {
            if (drop.type === 'silver') this.currency.addSilver(drop.amount);
          }
        }
      }
    }
  }

  /** Serialize hero + currency to save slot 0. */
  _quickSave() {
    const state = {
      hero: {
        hp:       this.hero.state.hp,
        maxHp:    this.hero.state.maxHp,
        position: { x: this.hero.state.x, y: this.hero.state.y },
        stats:    { attack: this.hero.state.attack, defense: this.hero.state.defense },
      },
      currency:  { totalSilver: this.currency.totalSilver },
      world:     { mapId: 'overworld' },
    };
    this.saveManager.save(0, state);
    console.info('[Save] Slot 0 saved.');
  }

  /** Restore hero + currency from save slot 0. */
  _quickLoad() {
    const state = this.saveManager.load(0);
    if (!state) { console.warn('[Load] No save in slot 0.'); return; }

    const h = state.hero;
    this.hero.state.hp    = h.hp;
    this.hero.state.maxHp = h.maxHp;
    this.hero.state.setPosition(h.position.x, h.position.y);
    this.hero.body.reset(h.position.x, h.position.y);

    if (state.currency) {
      this.currency._totalSilver = state.currency.totalSilver;
    }
    console.info('[Load] Slot 0 loaded.');
  }
}

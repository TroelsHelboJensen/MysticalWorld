import { MapManager } from './MapManager.js';
import { Hero } from '../characters/Hero.js';

/**
 * GameScene — Phaser.Scene responsible for rendering the tilemap, spawning
 * the hero and managing the camera.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    /** @type {MapManager} */
    this.mapManager = null;
    /** @type {Phaser.Tilemaps.Tilemap} */
    this.tilemap = null;
    /** @type {Hero} */
    this.hero = null;
  }

  preload() {
    this.load.image('tiles-overworld', 'assets/tilesets/overworld.png');
    this.load.tilemapTiledJSON('map-overworld', 'maps/overworld.json');
    this.load.spritesheet('hero', 'assets/sprites/hero.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    // Build MapManager from the cached Tiled JSON.
    const cache = this.cache.tilemap.get('map-overworld');
    this.mapManager = new MapManager(cache.data);

    // Render tilemap layers.
    this.tilemap = this.make.tilemap({ key: 'map-overworld' });
    const tileset = this.tilemap.addTilesetImage('overworld', 'tiles-overworld');

    this.tilemap.createLayer('Ground',   tileset, 0, 0);
    this.tilemap.createLayer('Details',  tileset, 0, 0);

    const collisionLayer = this.tilemap.createLayer('Collision', tileset, 0, 0);
    collisionLayer.setVisible(false);
    collisionLayer.setCollisionByExclusion([0]);

    // Spawn hero in the centre of the map, clear of the border.
    const spawnX = this.mapManager.mapWidthPx  / 2;
    const spawnY = this.mapManager.mapHeightPx / 2;
    this.hero = new Hero(this, spawnX, spawnY, this.mapManager);

    // Camera follows the hero within map bounds.
    this.cameras.main.setBounds(
      0, 0,
      this.mapManager.mapWidthPx,
      this.mapManager.mapHeightPx
    );
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

    // Hide HTML loading screen.
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
  }

  update(time, delta) {
    if (this.hero) this.hero.update(time, delta);
  }
}

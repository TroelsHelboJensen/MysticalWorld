import { MapManager } from './MapManager.js';

/**
 * GameScene — Phaser.Scene responsible for rendering the tilemap and
 * managing the camera. All map logic is delegated to MapManager.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    /** @type {MapManager} */
    this.mapManager = null;
    /** @type {Phaser.Tilemaps.Tilemap} */
    this.tilemap = null;
  }

  preload() {
    this.load.image('tiles-overworld', 'assets/tilesets/overworld.png');
    this.load.tilemapTiledJSON('map-overworld', 'maps/overworld.json');
  }

  create() {
    // Load Tiled JSON and build a MapManager from its raw data.
    const cache = this.cache.tilemap.get('map-overworld');
    this.mapManager = new MapManager(cache.data);

    // Build the Phaser tilemap from the cached Tiled JSON.
    this.tilemap = this.make.tilemap({ key: 'map-overworld' });
    const tileset = this.tilemap.addTilesetImage('overworld', 'tiles-overworld');

    // Render visible layers bottom-up.
    this.tilemap.createLayer('Ground', tileset, 0, 0);
    this.tilemap.createLayer('Details', tileset, 0, 0);

    // Collision layer is invisible — just used for physics.
    const collisionLayer = this.tilemap.createLayer('Collision', tileset, 0, 0);
    collisionLayer.setVisible(false);
    collisionLayer.setCollisionByExclusion([0]);

    // Camera bounds = full map size.
    this.cameras.main.setBounds(
      0,
      0,
      this.mapManager.mapWidthPx,
      this.mapManager.mapHeightPx
    );

    // Hide the HTML loading screen once the scene is ready.
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
  }

  update() {
    // Hero follow-cam will be wired in Phase 4 once the Hero sprite exists.
  }
}

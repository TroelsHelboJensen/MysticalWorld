/**
 * Vitest global setup — runs before every test file.
 *
 * Provides a minimal Phaser stub so that files that define Phaser scene/sprite
 * classes (e.g. GameScene, Hero) can be imported without a real browser or
 * Phaser CDN. Pure-JS logic classes never reference Phaser and are unaffected.
 */
global.Phaser = {
  AUTO: 0,
  // eslint-disable-next-line no-unused-vars
  Game: class Game { constructor(_config) {} },
  Scene: class Scene {
    constructor(config) {
      this.sys = {};
      this.config = config;
    }
  },
  GameObjects: {
    Sprite: class Sprite {
      constructor(scene, x, y, texture) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.texture = texture;
      }
    },
  },
};

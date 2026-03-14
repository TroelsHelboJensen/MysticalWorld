import { GameScene } from '../maps/GameScene.js';

// Phaser.AUTO = 0. Defined here so the config object is importable in tests
// without Phaser being present in the environment.
const AUTO = 0;

// Game configuration — exported so tests can verify settings without loading Phaser.
export const gameConfig = {
  type: AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  backgroundColor: '#000000',
  scene: [GameScene],
};

// Guard lets unit tests import this file without a browser / Phaser present.
if (typeof Phaser !== 'undefined') {
  new Phaser.Game(gameConfig);
}

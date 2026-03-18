import { GameScene } from '../maps/GameScene.js';
import { HUD }       from '../ui/HUD.js';
import { ShopUI }    from '../ui/ShopUI.js';
import { DialogueBox } from '../ui/DialogueBox.js';

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
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [GameScene, HUD, ShopUI, DialogueBox],
};

// Guard lets unit tests import this file without a browser / Phaser present.
if (typeof Phaser !== 'undefined') {
  new Phaser.Game(gameConfig);
}

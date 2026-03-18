import { describe, it, expect } from 'vitest';
import { gameConfig } from '../../js/main.js';

describe('gameConfig', () => {
  it('has correct canvas dimensions', () => {
    expect(gameConfig.width).toBe(800);
    expect(gameConfig.height).toBe(600);
  });

  it('enables pixel art mode', () => {
    expect(gameConfig.pixelArt).toBe(true);
  });

  it('has a black background', () => {
    expect(gameConfig.backgroundColor).toBe('#000000');
  });

  it('uses Phaser.AUTO renderer type (value 0)', () => {
    // Phaser.AUTO === 0. We avoid importing Phaser in tests; the constant
    // is kept in sync with the value Phaser uses.
    expect(gameConfig.type).toBe(0);
  });

  it('scene list contains GameScene as the first scene', () => {
    expect(Array.isArray(gameConfig.scene)).toBe(true);
    expect(gameConfig.scene.length).toBeGreaterThanOrEqual(1);
    // Verify by class name so we don't import Phaser in this test file
    expect(gameConfig.scene[0].name).toBe('GameScene');
  });
});

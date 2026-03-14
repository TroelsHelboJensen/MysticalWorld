import { describe, it, expect, beforeEach } from 'vitest';
import { HeroState, Direction } from '../../characters/HeroState.js';

describe('HeroState', () => {
  let hero;

  beforeEach(() => {
    hero = new HeroState({ x: 100, y: 100, speed: 160, maxHp: 100 });
  });

  // ─── Construction ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('sets initial position', () => {
      expect(hero.x).toBe(100);
      expect(hero.y).toBe(100);
    });

    it('sets hp equal to maxHp', () => {
      expect(hero.hp).toBe(100);
      expect(hero.maxHp).toBe(100);
    });

    it('starts facing down and not moving', () => {
      expect(hero.direction).toBe(Direction.DOWN);
      expect(hero.isMoving).toBe(false);
    });

    it('applies defaults when no options given', () => {
      const h = new HeroState();
      expect(h.speed).toBe(160);
      expect(h.maxHp).toBe(100);
    });
  });

  // ─── Health ────────────────────────────────────────────────────────────────

  describe('takeDamage', () => {
    it('reduces hp by the given amount', () => {
      hero.takeDamage(30);
      expect(hero.hp).toBe(70);
    });

    it('clamps hp at 0 — never goes negative', () => {
      hero.takeDamage(999);
      expect(hero.hp).toBe(0);
    });

    it('does not affect maxHp', () => {
      hero.takeDamage(50);
      expect(hero.maxHp).toBe(100);
    });
  });

  describe('heal', () => {
    it('restores hp', () => {
      hero.takeDamage(40);
      hero.heal(20);
      expect(hero.hp).toBe(80);
    });

    it('clamps hp at maxHp — never exceeds it', () => {
      hero.takeDamage(10);
      hero.heal(999);
      expect(hero.hp).toBe(100);
    });
  });

  describe('isDead', () => {
    it('returns false when hp > 0', () => {
      expect(hero.isDead()).toBe(false);
    });

    it('returns true exactly at hp === 0', () => {
      hero.takeDamage(100);
      expect(hero.isDead()).toBe(true);
    });

    it('returns false at hp === 1', () => {
      hero.takeDamage(99);
      expect(hero.isDead()).toBe(false);
    });
  });

  describe('increaseMaxHp', () => {
    it('raises maxHp by the given amount', () => {
      hero.increaseMaxHp(20);
      expect(hero.maxHp).toBe(120);
    });

    it('also heals by that amount by default', () => {
      hero.takeDamage(30);     // hp = 70
      hero.increaseMaxHp(20);  // maxHp = 120, hp = 90
      expect(hero.hp).toBe(90);
    });

    it('fills hp up to new maxHp when already at full hp', () => {
      // hp=100, maxHp=100 → increaseMaxHp(20) → maxHp=120, hp=120
      hero.increaseMaxHp(20, true);
      expect(hero.hp).toBe(120);
      expect(hero.maxHp).toBe(120);
    });

    it('does not heal when healOnIncrease is false', () => {
      hero.takeDamage(30);
      hero.increaseMaxHp(20, false);
      expect(hero.hp).toBe(70);
      expect(hero.maxHp).toBe(120);
    });
  });

  // ─── Movement ──────────────────────────────────────────────────────────────

  describe('move', () => {
    it('updates position to the resolved coords', () => {
      hero.move(1, 0, 110, 100);
      expect(hero.x).toBe(110);
      expect(hero.y).toBe(100);
    });

    it('sets isMoving true when dx or dy is non-zero', () => {
      hero.move(1, 0, 110, 100);
      expect(hero.isMoving).toBe(true);
    });

    it('sets isMoving false when both dx and dy are 0', () => {
      hero.move(1, 0, 110, 100);
      hero.move(0, 0, 110, 100);
      expect(hero.isMoving).toBe(false);
    });

    it('faces right when moving right', () => {
      hero.move(1, 0, 110, 100);
      expect(hero.direction).toBe(Direction.RIGHT);
    });

    it('faces left when moving left', () => {
      hero.move(-1, 0, 90, 100);
      expect(hero.direction).toBe(Direction.LEFT);
    });

    it('faces down when moving down', () => {
      hero.move(0, 1, 100, 110);
      expect(hero.direction).toBe(Direction.DOWN);
    });

    it('faces up when moving up', () => {
      hero.move(0, -1, 100, 90);
      expect(hero.direction).toBe(Direction.UP);
    });

    it('prefers horizontal direction on equal diagonal input', () => {
      hero.move(1, 1, 110, 110);
      expect(hero.direction).toBe(Direction.RIGHT);
    });

    it('uses vertical direction when |dy| > |dx|', () => {
      hero.move(0.5, 1, 105, 110);
      expect(hero.direction).toBe(Direction.DOWN);
    });
  });

  // ─── Invincibility ─────────────────────────────────────────────────────────

  describe('startInvincibility', () => {
    it('sets isInvincible to true', () => {
      hero.startInvincibility();
      expect(hero.isInvincible).toBe(true);
    });

    it('stores the remaining duration', () => {
      hero.startInvincibility(800);
      expect(hero._invincibilityRemaining).toBe(800);
    });

    it('defaults to 800ms', () => {
      hero.startInvincibility();
      expect(hero._invincibilityRemaining).toBe(800);
    });
  });

  describe('tickInvincibility', () => {
    it('decrements remaining time each tick', () => {
      hero.startInvincibility(800);
      hero.tickInvincibility(300);
      expect(hero._invincibilityRemaining).toBe(500);
    });

    it('clears invincibility when remaining time reaches 0', () => {
      hero.startInvincibility(800);
      hero.tickInvincibility(800);
      expect(hero.isInvincible).toBe(false);
    });

    it('clears invincibility when delta exceeds remaining time', () => {
      hero.startInvincibility(200);
      hero.tickInvincibility(500);
      expect(hero.isInvincible).toBe(false);
      expect(hero._invincibilityRemaining).toBe(0);
    });

    it('does nothing when not invincible', () => {
      expect(hero.isInvincible).toBe(false);
      expect(() => hero.tickInvincibility(100)).not.toThrow();
      expect(hero.isInvincible).toBe(false);
    });
  });

  describe('setPosition', () => {
    it('updates position without changing direction or isMoving', () => {
      hero.move(1, 0, 110, 100); // now facing right, isMoving true
      hero.setPosition(50, 60);
      expect(hero.x).toBe(50);
      expect(hero.y).toBe(60);
      expect(hero.direction).toBe(Direction.RIGHT);
      expect(hero.isMoving).toBe(true);
    });
  });
});

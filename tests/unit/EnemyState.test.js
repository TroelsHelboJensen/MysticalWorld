import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnemyState, EnemyAIState, createSlime, createDarknut } from '../../characters/EnemyState.js';

describe('EnemyState', () => {
  let enemy;

  beforeEach(() => {
    enemy = new EnemyState({ x: 0, y: 0, hp: 10, maxHp: 10, attack: 5, defense: 0,
      speed: 60, detectionRange: 150, attackRange: 32 });
  });

  // ─── Construction ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('sets initial position', () => {
      expect(enemy.x).toBe(0);
      expect(enemy.y).toBe(0);
    });

    it('sets hp equal to maxHp', () => {
      expect(enemy.hp).toBe(10);
      expect(enemy.maxHp).toBe(10);
    });

    it('sets attack and defense', () => {
      expect(enemy.attack).toBe(5);
      expect(enemy.defense).toBe(0);
    });

    it('sets speed, detectionRange and attackRange', () => {
      expect(enemy.speed).toBe(60);
      expect(enemy.detectionRange).toBe(150);
      expect(enemy.attackRange).toBe(32);
    });

    it('applies defaults when no options are given', () => {
      const e = new EnemyState();
      expect(e.hp).toBe(10);
      expect(e.maxHp).toBe(10);
      expect(e.attack).toBe(5);
      expect(e.defense).toBe(0);
      expect(e.speed).toBe(60);
      expect(e.detectionRange).toBe(150);
      expect(e.attackRange).toBe(32);
      expect(e.dropTable).toEqual([]);
    });

    it('starts in IDLE ai state', () => {
      expect(enemy.aiState).toBe(EnemyAIState.IDLE);
    });
  });

  // ─── Health ────────────────────────────────────────────────────────────────

  describe('takeDamage', () => {
    it('reduces hp by the given amount', () => {
      enemy.takeDamage(3);
      expect(enemy.hp).toBe(7);
    });

    it('clamps hp at 0 — never goes negative', () => {
      enemy.takeDamage(999);
      expect(enemy.hp).toBe(0);
    });

    it('does not affect maxHp', () => {
      enemy.takeDamage(5);
      expect(enemy.maxHp).toBe(10);
    });
  });

  describe('isDead', () => {
    it('returns false when hp > 0', () => {
      expect(enemy.isDead()).toBe(false);
    });

    it('returns true exactly at hp === 0', () => {
      enemy.takeDamage(10);
      expect(enemy.isDead()).toBe(true);
    });

    it('returns false at hp === 1', () => {
      enemy.takeDamage(9);
      expect(enemy.isDead()).toBe(false);
    });
  });

  // ─── AI tick — state transitions ──────────────────────────────────────────

  describe('tick', () => {
    it('returns IDLE when hero is beyond detectionRange', () => {
      // enemy at (0,0), hero far away
      const state = enemy.tick(300, 0, 16);
      expect(state).toBe(EnemyAIState.IDLE);
      expect(enemy.aiState).toBe(EnemyAIState.IDLE);
    });

    it('returns CHASE when hero is within detectionRange but outside attackRange', () => {
      // hero at (100,0) — distance 100, within detectionRange 150, outside attackRange 32
      const state = enemy.tick(100, 0, 16);
      expect(state).toBe(EnemyAIState.CHASE);
      expect(enemy.aiState).toBe(EnemyAIState.CHASE);
    });

    it('moves toward hero in CHASE state', () => {
      const initialX = enemy.x;
      enemy.tick(100, 0, 16); // hero to the right
      expect(enemy.x).toBeGreaterThan(initialX);
    });

    it('returns ATTACK when hero is within attackRange', () => {
      // hero at (10,0) — distance 10, within attackRange 32
      const state = enemy.tick(10, 0, 16);
      expect(state).toBe(EnemyAIState.ATTACK);
      expect(enemy.aiState).toBe(EnemyAIState.ATTACK);
    });

    it('returns DEAD once enemy is dead and stays dead', () => {
      enemy.takeDamage(10); // hp=0
      const state1 = enemy.tick(5, 0, 16);
      expect(state1).toBe(EnemyAIState.DEAD);

      // stays dead even if hero moves away
      const state2 = enemy.tick(1000, 1000, 16);
      expect(state2).toBe(EnemyAIState.DEAD);
    });

    it('does not move in IDLE state', () => {
      const x = enemy.x;
      const y = enemy.y;
      enemy.tick(300, 0, 16); // hero far away → IDLE
      expect(enemy.x).toBe(x);
      expect(enemy.y).toBe(y);
    });

    it('does not move in ATTACK state', () => {
      // hero within attackRange
      const x = enemy.x;
      const y = enemy.y;
      enemy.tick(10, 0, 16); // ATTACK
      expect(enemy.x).toBe(x);
      expect(enemy.y).toBe(y);
    });
  });

  // ─── generateDrops ────────────────────────────────────────────────────────

  describe('generateDrops', () => {
    it('returns an empty array when dropTable is empty', () => {
      expect(enemy.generateDrops()).toEqual([]);
    });

    it('always includes items with chance 1.0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const e = new EnemyState({
        dropTable: [{ type: 'silver', amount: 5, chance: 1.0 }],
      });
      const drops = e.generateDrops();
      expect(drops).toEqual([{ type: 'silver', amount: 5 }]);
      vi.restoreAllMocks();
    });

    it('never includes items with chance 0.0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const e = new EnemyState({
        dropTable: [{ type: 'gold', amount: 1, chance: 0.0 }],
      });
      const drops = e.generateDrops();
      expect(drops).toEqual([]);
      vi.restoreAllMocks();
    });

    it('returns only { type, amount } — not the chance field', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const e = new EnemyState({
        dropTable: [{ type: 'silver', amount: 3, chance: 1.0 }],
      });
      const [drop] = e.generateDrops();
      expect(drop).not.toHaveProperty('chance');
      vi.restoreAllMocks();
    });

    it('can return multiple drops from one roll', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const e = new EnemyState({
        dropTable: [
          { type: 'silver', amount: 3,  chance: 1.0 },
          { type: 'silver', amount: 10, chance: 1.0 },
        ],
      });
      expect(e.generateDrops()).toHaveLength(2);
      vi.restoreAllMocks();
    });
  });

  // ─── Preset: createSlime ──────────────────────────────────────────────────

  describe('createSlime', () => {
    let slime;

    beforeEach(() => {
      slime = createSlime(50, 80);
    });

    it('positions the slime at the given coordinates', () => {
      expect(slime.x).toBe(50);
      expect(slime.y).toBe(80);
    });

    it('has correct hp and maxHp', () => {
      expect(slime.hp).toBe(15);
      expect(slime.maxHp).toBe(15);
    });

    it('has correct attack and defense', () => {
      expect(slime.attack).toBe(4);
      expect(slime.defense).toBe(0);
    });

    it('has correct speed', () => {
      expect(slime.speed).toBe(50);
    });

    it('always drops 3 silver (chance 1.0 entry)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const drops = slime.generateDrops();
      const silver3 = drops.find(d => d.type === 'silver' && d.amount === 3);
      expect(silver3).toBeDefined();
      vi.restoreAllMocks();
    });

    it('sometimes drops 10 silver (chance 0.2 entry)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // below 0.2 → drops
      const drops = slime.generateDrops();
      const silver10 = drops.find(d => d.type === 'silver' && d.amount === 10);
      expect(silver10).toBeDefined();
      vi.restoreAllMocks();
    });
  });

  // ─── Preset: createDarknut ────────────────────────────────────────────────

  describe('createDarknut', () => {
    let darknut;

    beforeEach(() => {
      darknut = createDarknut(200, 300);
    });

    it('positions the darknut at the given coordinates', () => {
      expect(darknut.x).toBe(200);
      expect(darknut.y).toBe(300);
    });

    it('has correct hp and maxHp', () => {
      expect(darknut.hp).toBe(40);
      expect(darknut.maxHp).toBe(40);
    });

    it('has correct attack', () => {
      expect(darknut.attack).toBe(12);
    });

    it('has correct defense', () => {
      expect(darknut.defense).toBe(8);
    });

    it('has correct speed', () => {
      expect(darknut.speed).toBe(70);
    });

    it('always drops 20 silver (chance 1.0 entry)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.6);
      const drops = darknut.generateDrops();
      const silver = drops.find(d => d.type === 'silver' && d.amount === 20);
      expect(silver).toBeDefined();
      vi.restoreAllMocks();
    });

    it('sometimes drops 1 gold (chance 0.5 entry)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.4); // below 0.5 → drops
      const drops = darknut.generateDrops();
      const gold = drops.find(d => d.type === 'gold' && d.amount === 1);
      expect(gold).toBeDefined();
      vi.restoreAllMocks();
    });

    it('does not drop gold when random is above 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      const drops = darknut.generateDrops();
      const gold = drops.find(d => d.type === 'gold');
      expect(gold).toBeUndefined();
      vi.restoreAllMocks();
    });
  });
});

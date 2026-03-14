import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryManager, EQUIPMENT_SLOTS } from '../../js/InventoryManager.js';

const sword   = { name: 'Iron Sword',   slot: 'weapon',    stats: { attack: 8 },   value: 50 };
const shield  = { name: 'Wood Shield',  slot: 'shield',    stats: { defense: 4 },  value: 30 };
const armor   = { name: 'Chain Armor',  slot: 'armor',     stats: { defense: 6 },  value: 80 };
const ring    = { name: 'Speed Ring',   slot: 'accessory', stats: { speed: 20 },   value: 60 };
const potion  = { name: 'Potion',       slot: 'consumable',stats: {},              value: 10 };

describe('InventoryManager', () => {
  let inv;

  beforeEach(() => {
    inv = new InventoryManager();
  });

  // ─── add ────────────────────────────────────────────────────────────────────

  describe('add', () => {
    it('fills the first empty slot and returns its index', () => {
      const idx = inv.add(sword);
      expect(idx).toBe(0);
    });

    it('returns -1 when all 24 slots are occupied', () => {
      for (let i = 0; i < 24; i++) inv.add({ ...sword, name: `item${i}` });
      expect(inv.add(sword)).toBe(-1);
    });

    it('fills gaps left by remove()', () => {
      inv.add(sword);   // slot 0
      inv.add(shield);  // slot 1
      inv.remove(0);
      expect(inv.add(ring)).toBe(0);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('returns the item and empties the slot', () => {
      inv.add(sword);
      const removed = inv.remove(0);
      expect(removed).toEqual(sword);
      expect(inv.size).toBe(0);
    });

    it('returns null for an empty slot', () => {
      expect(inv.remove(5)).toBeNull();
    });
  });

  // ─── equip ──────────────────────────────────────────────────────────────────

  describe('equip', () => {
    it('moves item from inventory to equipment slot', () => {
      inv.add(sword);
      inv.equip(0);
      expect(inv.getEquipped('weapon')).toEqual(sword);
      expect(inv.size).toBe(0);
    });

    it('returns null when no item was previously equipped', () => {
      inv.add(sword);
      expect(inv.equip(0)).toBeNull();
    });

    it('returns the displaced item when replacing equipment', () => {
      const sword2 = { ...sword, name: 'Steel Sword' };
      inv.add(sword);
      inv.equip(0);
      inv.add(sword2);
      const displaced = inv.equip(0);
      expect(displaced).toEqual(sword);
      expect(inv.getEquipped('weapon')).toEqual(sword2);
    });

    it('does not equip item with invalid slot', () => {
      inv.add(potion); // slot: 'consumable' — not a valid equipment slot
      expect(inv.equip(0)).toBeNull();
      expect(inv.getEquipped('weapon')).toBeNull();
      expect(inv.size).toBe(1); // still in inventory
    });

    it('returns null for empty inventory slot', () => {
      expect(inv.equip(10)).toBeNull();
    });
  });

  // ─── unequip ────────────────────────────────────────────────────────────────

  describe('unequip', () => {
    it('moves equipped item back to inventory', () => {
      inv.add(sword);
      inv.equip(0);
      const result = inv.unequip('weapon');
      expect(result).toBe(true);
      expect(inv.getEquipped('weapon')).toBeNull();
      expect(inv.size).toBe(1);
    });

    it('returns false when nothing is equipped in that slot', () => {
      expect(inv.unequip('weapon')).toBe(false);
    });

    it('returns false when inventory is full', () => {
      inv.add(sword);
      inv.equip(0);
      for (let i = 0; i < 24; i++) inv.add({ ...shield, name: `s${i}` });
      expect(inv.unequip('weapon')).toBe(false);
      expect(inv.getEquipped('weapon')).toEqual(sword); // still equipped
    });
  });

  // ─── getEquipped ────────────────────────────────────────────────────────────

  describe('getEquipped', () => {
    it('returns null for all slots on a new inventory', () => {
      for (const slot of EQUIPMENT_SLOTS) {
        expect(inv.getEquipped(slot)).toBeNull();
      }
    });

    it('returns the equipped item after equip()', () => {
      inv.add(shield);
      inv.equip(0);
      expect(inv.getEquipped('shield')).toEqual(shield);
    });
  });

  // ─── getItems ───────────────────────────────────────────────────────────────

  describe('getItems', () => {
    it('returns empty array when inventory is empty', () => {
      expect(inv.getItems()).toEqual([]);
    });

    it('returns items with their indices', () => {
      inv.add(sword);
      inv.add(shield);
      const items = inv.getItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ index: 0, item: sword });
      expect(items[1]).toEqual({ index: 1, item: shield });
    });
  });

  // ─── size ───────────────────────────────────────────────────────────────────

  describe('size', () => {
    it('is 0 on a new inventory', () => {
      expect(inv.size).toBe(0);
    });

    it('increments on add()', () => {
      inv.add(sword);
      inv.add(shield);
      expect(inv.size).toBe(2);
    });

    it('decrements on equip()', () => {
      inv.add(sword);
      inv.equip(0);
      expect(inv.size).toBe(0);
    });
  });
});

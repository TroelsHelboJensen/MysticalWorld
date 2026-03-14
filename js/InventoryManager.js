export const EQUIPMENT_SLOTS = ['weapon', 'shield', 'armor', 'accessory'];

export class InventoryManager {
  constructor() {
    this._items    = new Array(24).fill(null);
    this._equipped = { weapon: null, shield: null, armor: null, accessory: null };
  }

  // Returns the slot index where item was placed, or -1 if inventory full
  add(item) {
    const index = this._items.indexOf(null);
    if (index === -1) return -1;
    this._items[index] = item;
    return index;
  }

  // Removes item at index; returns the item or null if slot was empty
  remove(index) {
    const item = this._items[index] ?? null;
    this._items[index] = null;
    return item;
  }

  // Equips item at inventory index to its slot.
  // Returns displaced item (previous equipped item) or null.
  // Returns null without equipping if item.slot is not a valid equipment slot.
  equip(index) {
    const item = this._items[index];
    if (!item) return null;
    if (!EQUIPMENT_SLOTS.includes(item.slot)) return null;

    const displaced = this._equipped[item.slot];
    this._equipped[item.slot] = item;
    this._items[index] = null;
    return displaced;
  }

  // Unequips the item in the given slot back to inventory.
  // Returns true on success, false if no item in slot or no room in inventory.
  unequip(slot) {
    const item = this._equipped[slot];
    if (!item) return false;
    const index = this._items.indexOf(null);
    if (index === -1) return false;
    this._items[index] = item;
    this._equipped[slot] = null;
    return true;
  }

  // Returns equipped item for slot, or null
  getEquipped(slot) {
    return this._equipped[slot] ?? null;
  }

  // Returns array of all non-null inventory items with their indices
  getItems() {
    return this._items
      .map((item, index) => (item ? { index, item } : null))
      .filter(Boolean);
  }

  get size() {
    return this._items.filter(Boolean).length;
  }
}

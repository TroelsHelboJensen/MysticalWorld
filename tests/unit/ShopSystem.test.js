import { describe, it, expect, beforeEach } from 'vitest';
import { ShopSystem }       from '../../js/ShopSystem.js';
import { CurrencySystem }   from '../../js/CurrencySystem.js';
import { InventoryManager } from '../../js/InventoryManager.js';

const SWORD = {
  id: 'iron_sword', name: 'Iron Sword', price: 150,
  item: { id: 'iron_sword', name: 'Iron Sword', slot: 'weapon', attack: 5 },
};
const SHIELD = {
  id: 'wood_shield', name: 'Wooden Shield', price: 80,
  item: { id: 'wood_shield', name: 'Wooden Shield', slot: 'shield', defense: 3 },
};
const POTION = {
  id: 'small_potion', name: 'Small Potion', price: 30,
  item: { id: 'small_potion', name: 'Small Potion', slot: null, healAmount: 20 },
};

function makeShop()     { return new ShopSystem([SWORD, SHIELD, POTION]); }
function makeCurrency(s = 200) { return new CurrencySystem(s); }
function makeInventory() { return new InventoryManager(); }

describe('ShopSystem – catalogue', () => {
  it('exposes catalogue entries', () => {
    const shop = makeShop();
    expect(shop.catalogue).toHaveLength(3);
    expect(shop.catalogue[0].id).toBe('iron_sword');
  });

  it('catalogue is a copy – mutating it does not affect shop', () => {
    const shop = makeShop();
    shop.catalogue[0].price = 9999;
    expect(shop.catalogue[0].price).toBe(150);
  });
});

describe('ShopSystem – buy', () => {
  it('returns ok and deducts price when purchase succeeds', () => {
    const shop = makeShop();
    const currency = makeCurrency(200);
    const inventory = makeInventory();
    const result = shop.buy('iron_sword', currency, inventory);
    expect(result).toBe('ok');
    expect(currency.totalSilver).toBe(50); // 200 - 150
  });

  it('adds item to inventory on purchase', () => {
    const shop = makeShop();
    const currency = makeCurrency(200);
    const inventory = makeInventory();
    shop.buy('iron_sword', currency, inventory);
    expect(inventory.size).toBe(1);
    expect(inventory.getItems()[0].item.id).toBe('iron_sword');
  });

  it('returns not_found for unknown item id', () => {
    const shop = makeShop();
    const result = shop.buy('unknown_item', makeCurrency(999), makeInventory());
    expect(result).toBe('not_found');
  });

  it('returns insufficient_funds when player cannot afford', () => {
    const shop = makeShop();
    const result = shop.buy('iron_sword', makeCurrency(100), makeInventory());
    expect(result).toBe('insufficient_funds');
  });

  it('does not deduct currency on insufficient_funds', () => {
    const shop = makeShop();
    const currency = makeCurrency(100);
    shop.buy('iron_sword', currency, makeCurrency(100));
    expect(currency.totalSilver).toBe(100);
  });

  it('returns inventory_full when no slots remain', () => {
    const shop = makeShop();
    const currency = makeCurrency(9999);
    const inventory = makeInventory();
    // Fill all 24 slots
    for (let i = 0; i < 24; i++) {
      inventory.add({ id: `filler_${i}`, slot: null });
    }
    const result = shop.buy('small_potion', currency, inventory);
    expect(result).toBe('inventory_full');
  });

  it('does not deduct currency when inventory is full', () => {
    const shop = makeShop();
    const currency = makeCurrency(9999);
    const inventory = makeInventory();
    for (let i = 0; i < 24; i++) inventory.add({ id: `filler_${i}`, slot: null });
    shop.buy('small_potion', currency, inventory);
    expect(currency.totalSilver).toBe(9999);
  });

  it('can buy an item at exact price', () => {
    const shop = makeShop();
    const currency = makeCurrency(30);
    const result = shop.buy('small_potion', currency, makeInventory());
    expect(result).toBe('ok');
    expect(currency.totalSilver).toBe(0);
  });

  it('purchased item is a copy – shop catalogue item is unchanged', () => {
    const shop = makeShop();
    const inventory = makeInventory();
    shop.buy('iron_sword', makeCurrency(200), inventory);
    const bought = inventory.getItems()[0].item;
    bought.attack = 9999;
    expect(shop.catalogue[0].item.attack).toBe(5);
  });
});

describe('ShopSystem – sell', () => {
  it('removes item from inventory', () => {
    const shop = makeShop();
    const currency = makeCurrency(200);
    const inventory = makeInventory();
    shop.buy('iron_sword', currency, inventory);
    const idx = inventory.getItems()[0].index;
    shop.sell(idx, currency, inventory);
    expect(inventory.size).toBe(0);
  });

  it('adds half the buy price (floored) in silver', () => {
    const shop = makeShop();
    const currency = makeCurrency(200);
    const inventory = makeInventory();
    shop.buy('iron_sword', currency, inventory); // costs 150 → now 50S
    const idx = inventory.getItems()[0].index;
    shop.sell(idx, currency, inventory); // sells for 75S → now 125S
    expect(currency.totalSilver).toBe(125);
  });

  it('floors odd buy prices correctly', () => {
    // SHIELD costs 80 → sell = 40
    const shop = makeShop();
    const currency = makeCurrency(200);
    const inventory = makeInventory();
    shop.buy('wood_shield', currency, inventory); // costs 80 → now 120S
    const idx = inventory.getItems()[0].index;
    shop.sell(idx, currency, inventory); // sells for 40S → 160S
    expect(currency.totalSilver).toBe(160);
  });

  it('returns ok on successful sell', () => {
    const shop = makeShop();
    const currency = makeCurrency(200);
    const inventory = makeInventory();
    shop.buy('small_potion', currency, inventory);
    const idx = inventory.getItems()[0].index;
    const result = shop.sell(idx, currency, inventory);
    expect(result).toBe('ok');
  });

  it('returns empty_slot for an empty index', () => {
    const shop = makeShop();
    const result = shop.sell(0, makeCurrency(100), makeInventory());
    expect(result).toBe('empty_slot');
  });

  it('sells unknown items for at least 1 silver', () => {
    const shop = makeShop();
    const currency = makeCurrency(0);
    const inventory = makeInventory();
    inventory.add({ id: 'mystery_thing', slot: null });
    const idx = inventory.getItems()[0].index;
    shop.sell(idx, currency, inventory);
    expect(currency.totalSilver).toBeGreaterThanOrEqual(1);
  });
});

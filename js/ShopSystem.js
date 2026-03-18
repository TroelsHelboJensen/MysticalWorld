/**
 * ShopSystem – pure JS vendor logic (no Phaser).
 *
 * A shop holds a catalogue of ShopItems, each with:
 *   { id, name, price (silver), item (the inventory item object) }
 *
 * buy(id, currency, inventory)  – deducts price from currency and adds item to inventory
 * sell(invIndex, currency, inventory) – removes item from inventory and adds half its price
 */
export class ShopSystem {
  /**
   * @param {Array<{id:string, name:string, price:number, item:object}>} catalogue
   */
  constructor(catalogue = []) {
    this._catalogue = catalogue.map(entry => ({ ...entry }));
  }

  get catalogue() {
    return this._catalogue.map(entry => ({ ...entry }));
  }

  /**
   * Purchase an item by its catalogue id.
   * @param {string}            id
   * @param {CurrencySystem}    currency
   * @param {InventoryManager}  inventory
   * @returns {'ok'|'not_found'|'insufficient_funds'|'inventory_full'}
   */
  buy(id, currency, inventory) {
    const entry = this._catalogue.find(e => e.id === id);
    if (!entry) return 'not_found';
    if (currency.totalSilver < entry.price) return 'insufficient_funds';

    // Check inventory has room before spending
    const items = inventory.getItems();
    const capacity = 24; // InventoryManager fixed size
    if (items.length >= capacity) return 'inventory_full';

    currency.spend(entry.price);
    inventory.add({ ...entry.item });
    return 'ok';
  }

  /**
   * Sell an item from inventory at half its buy price (rounded down).
   * Looks up price from catalogue by item id; unknown items sell for 1 silver.
   * @param {number}            invIndex   index in InventoryManager
   * @param {CurrencySystem}    currency
   * @param {InventoryManager}  inventory
   * @returns {'ok'|'empty_slot'}
   */
  sell(invIndex, currency, inventory) {
    const items = inventory.getItems();
    const slot  = items.find(s => s.index === invIndex);
    if (!slot) return 'empty_slot';

    const item     = slot.item;
    const entry    = this._catalogue.find(e => e.id === item.id);
    const buyPrice = entry ? entry.price : 2; // fallback so sell >= 1
    const sellPrice = Math.max(1, Math.floor(buyPrice / 2));

    inventory.remove(invIndex);
    currency.addSilver(sellPrice);
    return 'ok';
  }
}

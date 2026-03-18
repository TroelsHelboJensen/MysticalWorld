import { describe, it, expect, beforeEach } from 'vitest';
import { HUDState }         from '../../ui/HUDState.js';
import { HeroState }        from '../../characters/HeroState.js';
import { CurrencySystem }   from '../../js/CurrencySystem.js';
import { InventoryManager } from '../../js/InventoryManager.js';

function makeHero(opts)     { return new HeroState(opts); }
function makeCurrency(s)    { return new CurrencySystem(s); }
function makeInventory()    { return new InventoryManager(); }

describe('HUDState – HP', () => {
  it('reflects hero hp and maxHp', () => {
    const hero = makeHero({ maxHp: 80 });
    hero.takeDamage(20);
    const snap = new HUDState({ heroState: hero }).snapshot();
    expect(snap.hp).toBe(60);
    expect(snap.maxHp).toBe(80);
  });

  it('hpRatio is 1 at full health', () => {
    const snap = new HUDState({ heroState: makeHero() }).snapshot();
    expect(snap.hpRatio).toBe(1);
  });

  it('hpRatio is 0 when dead', () => {
    const hero = makeHero({ maxHp: 50 });
    hero.takeDamage(50);
    const snap = new HUDState({ heroState: hero }).snapshot();
    expect(snap.hpRatio).toBe(0);
  });

  it('hpRatio is clamped to [0, 1]', () => {
    const hero = makeHero({ maxHp: 100 });
    // Directly set hp beyond max to test clamping
    hero.hp = 200;
    const snap = new HUDState({ heroState: hero }).snapshot();
    expect(snap.hpRatio).toBe(1);
  });

  it('hpRatio is 0 when maxHp is 0', () => {
    const hero = makeHero({ maxHp: 100 });
    hero.maxHp = 0;
    const snap = new HUDState({ heroState: hero }).snapshot();
    expect(snap.hpRatio).toBe(0);
  });

  it('hpRatio is proportional at half health', () => {
    const hero = makeHero({ maxHp: 100 });
    hero.takeDamage(50);
    const snap = new HUDState({ heroState: hero }).snapshot();
    expect(snap.hpRatio).toBeCloseTo(0.5);
  });
});

describe('HUDState – purse', () => {
  it('shows formatted currency', () => {
    const snap = new HUDState({
      heroState: makeHero(),
      currency: makeCurrency(347),
    }).snapshot();
    expect(snap.purse).toBe('3G 47S');
  });

  it('defaults to 0G 0S when no currency provided', () => {
    const snap = new HUDState({ heroState: makeHero() }).snapshot();
    expect(snap.purse).toBe('0G 0S');
  });

  it('updates when currency changes', () => {
    const currency = makeCurrency(0);
    const hud = new HUDState({ heroState: makeHero(), currency });
    currency.addGold(5);
    expect(hud.snapshot().purse).toBe('5G 0S');
  });
});

describe('HUDState – weapon', () => {
  it('shows — when nothing is equipped', () => {
    const snap = new HUDState({
      heroState: makeHero(),
      inventory: makeInventory(),
    }).snapshot();
    expect(snap.weapon).toBe('—');
  });

  it('shows equipped weapon name', () => {
    const inventory = makeInventory();
    inventory.add({ id: 'iron_sword', name: 'Iron Sword', slot: 'weapon', attack: 5 });
    inventory.equip(0);
    const snap = new HUDState({
      heroState: makeHero(),
      inventory,
    }).snapshot();
    expect(snap.weapon).toBe('Iron Sword');
  });

  it('shows — again after unequipping', () => {
    const inventory = makeInventory();
    inventory.add({ id: 'iron_sword', name: 'Iron Sword', slot: 'weapon', attack: 5 });
    inventory.equip(0);
    inventory.unequip('weapon');
    const snap = new HUDState({
      heroState: makeHero(),
      inventory,
    }).snapshot();
    expect(snap.weapon).toBe('—');
  });

  it('defaults to — when no inventory provided', () => {
    const snap = new HUDState({ heroState: makeHero() }).snapshot();
    expect(snap.weapon).toBe('—');
  });
});

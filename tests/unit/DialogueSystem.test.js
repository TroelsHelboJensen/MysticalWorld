import { describe, it, expect, beforeEach } from 'vitest';
import { DialogueSystem } from '../../ui/DialogueSystem.js';

const LINEAR_DIALOGUE = {
  pages: [
    { text: 'Hello!', options: [] },
    { text: 'How are you?', options: [] },
    { text: 'Goodbye.', options: [] },
  ],
};

const BRANCHING_DIALOGUE = {
  pages: [
    { text: 'Greetings, traveller!', options: [] },
    { text: 'Can I help you?', options: ['Talk', 'Trade', 'Goodbye'] },
  ],
};

describe('DialogueSystem', () => {
  let ds;

  beforeEach(() => {
    ds = new DialogueSystem();
    ds.register('villager', LINEAR_DIALOGUE);
    ds.register('shopkeeper', BRANCHING_DIALOGUE);
  });

  // ─── start ──────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('returns null for an unknown npcId', () => {
      expect(ds.start('unknown')).toBeNull();
    });

    it('returns the first page when starting dialogue', () => {
      const page = ds.start('villager');
      expect(page.text).toBe('Hello!');
    });

    it('sets isOpen() to true after start', () => {
      ds.start('villager');
      expect(ds.isOpen()).toBe(true);
    });
  });

  // ─── isOpen ─────────────────────────────────────────────────────────────────

  describe('isOpen', () => {
    it('returns false before any dialogue starts', () => {
      expect(ds.isOpen()).toBe(false);
    });

    it('returns false after unknown npcId', () => {
      ds.start('unknown');
      expect(ds.isOpen()).toBe(false);
    });
  });

  // ─── current ────────────────────────────────────────────────────────────────

  describe('current', () => {
    it('returns null when no dialogue is open', () => {
      expect(ds.current()).toBeNull();
    });

    it('returns the first page immediately after start', () => {
      ds.start('villager');
      expect(ds.current().text).toBe('Hello!');
    });

    it('returns options array from the current page', () => {
      ds.start('shopkeeper');
      ds.next(); // advance to page with options
      expect(ds.current().options).toEqual(['Talk', 'Trade', 'Goodbye']);
    });
  });

  // ─── next ────────────────────────────────────────────────────────────────────

  describe('next', () => {
    it('advances to the second page', () => {
      ds.start('villager');
      const page = ds.next();
      expect(page.text).toBe('How are you?');
    });

    it('returns null and closes dialogue after the last page', () => {
      ds.start('villager');
      ds.next(); // page 2
      ds.next(); // page 3
      const result = ds.next(); // past end
      expect(result).toBeNull();
      expect(ds.isOpen()).toBe(false);
    });

    it('returns null when called while not open', () => {
      expect(ds.next()).toBeNull();
    });
  });

  // ─── choose ─────────────────────────────────────────────────────────────────

  describe('choose', () => {
    it('advances the dialogue when choosing an option', () => {
      ds.start('shopkeeper');
      ds.next(); // move to branching page
      const result = ds.choose(0); // pick 'Talk'
      // after last page, dialogue closes
      expect(result).toBeNull();
      expect(ds.isOpen()).toBe(false);
    });
  });

  // ─── close ──────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('sets isOpen to false', () => {
      ds.start('villager');
      ds.close();
      expect(ds.isOpen()).toBe(false);
    });

    it('current() returns null after close', () => {
      ds.start('villager');
      ds.close();
      expect(ds.current()).toBeNull();
    });
  });

  // ─── linear dialogue end-to-end ─────────────────────────────────────────────

  describe('linear dialogue end-to-end', () => {
    it('can walk through all pages and close naturally', () => {
      ds.start('villager');
      expect(ds.current().text).toBe('Hello!');
      ds.next();
      expect(ds.current().text).toBe('How are you?');
      ds.next();
      expect(ds.current().text).toBe('Goodbye.');
      const done = ds.next();
      expect(done).toBeNull();
      expect(ds.isOpen()).toBe(false);
    });
  });

  // ─── branching dialogue end-to-end ──────────────────────────────────────────

  describe('branching dialogue end-to-end', () => {
    it('shows options on the branching page', () => {
      ds.start('shopkeeper');
      const first = ds.current();
      expect(first.options).toEqual([]);
      const second = ds.next();
      expect(second.options).toEqual(['Talk', 'Trade', 'Goodbye']);
    });
  });
});

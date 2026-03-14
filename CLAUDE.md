# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MysticalWorld is a top-down RPG inspired by *The Legend of Zelda: A Link to the Past*, built with **Phaser.js 3** (CDN) and **vanilla JavaScript**. No build step is required to run the game — open `index.html` directly in a browser.

## Commands

```bash
npm test              # run unit + integration tests (Vitest)
npm run test:watch    # Vitest in watch mode
npm run test:e2e      # Playwright E2E tests (requires local server running)
npm run test:all      # both Vitest and Playwright
npm start             # serve the project locally (e.g. npx serve .)
```

To run a single test file:
```bash
npx vitest run tests/unit/CurrencySystem.test.js
```

## Folder Roles

| Path | Role |
|------|------|
| `index.html` | Entry point — loads Phaser via CDN and boots the game |
| `js/main.js` | Phaser game config and scene list |
| `css/ui.css` | Styles for HTML overlays only (loading screen, menu wrappers) |
| `characters/` | Hero, enemies, NPCs — each split into a pure-JS state class and a Phaser sprite class |
| `maps/` | Tiled JSON map files and MapManager (pure JS) |
| `ui/` | Phaser scene overlays: HUD, Inventory, DialogBox, ShopUI, SaveSlotUI |
| `persistence/` | SaveManager (pure JS, uses localStorage) |
| `assets/` | Sprites, tilesets, sounds |
| `tests/unit/` | Vitest unit tests (pure JS only, no Phaser) |
| `tests/integration/` | Vitest integration tests (e.g. save/load roundtrip) |
| `tests/e2e/` | Playwright browser tests |

## Core Architecture Rule: Logic vs Phaser

Every system must be split into two layers:

- **Pure JS class** (e.g. `HeroState.js`, `InventoryManager.js`) — holds all data and logic, no Phaser imports. This is what tests run against.
- **Phaser class** (e.g. `Hero.js extends Phaser.GameObjects.Sprite`) — thin wrapper that reads input, calls the pure JS class, and updates the rendered sprite.

Never put game logic (damage formulas, inventory operations, currency math) inside a Phaser scene or sprite class.

## Key Systems

### Currency
- Stored internally as total silver. 100 Silver = 1 Gold.
- Display format: `3G 47S`
- `CurrencySystem.js` — `addSilver`, `addGold`, `spend`, `toString`

### Equipment Slots
- Four slots: `weapon`, `shield`, `armor`, `accessory`
- Equipping recalculates stats via `StatSystem.js`
- Items have a `slot` field; equipping to the wrong slot is rejected

### Combat Formula
- `damage = max(1, attacker.attack - defender.defense)`
- Crit: 10% chance, 1.5× multiplier
- Hero gets 800ms invincibility frames after being hit

### Save State Shape
```js
{
  hero: { hp, maxHp, position: {x, y}, stats, inventory, equipped },
  currency: { totalSilver },
  world: { mapId, roomId, visitedRooms[], chestStates{}, questFlags{} }
}
```

### Tile Size
32×32 pixels throughout.

## GitHub Project Setup

All GitHub issues, labels, and milestones are defined in [`github-setup.json`](github-setup.json). An agent can use this file with the GitHub CLI (`gh`) to create the full project board. See the `instructions_for_agent` section in that file.

## Testing Requirements
Before marking any task as complete:
1. Write unit tests for new functionality or run all tests
2. Run the full test suite with: `npm test`
3. If tests fail:
 - Analyse the failure output
 - Fix the code (not the tests, unless tests are incorrect)
 - Re-run tests until all pass
4. For API endpoints, include integration tests that verify:
 - Success responses with valid input
 - Edge cases
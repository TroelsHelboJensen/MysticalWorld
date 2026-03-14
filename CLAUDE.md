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

All 18 issues, 5 milestones and 13 labels have been created on GitHub. The source of truth is [`github-setup.json`](github-setup.json).

- Issues: #1–#18 (one per phase)
- Milestones: M1 (IDs 1–5) mapped to issues automatically
- Labels: `phase:*`, `type:*`, `priority:*`

### gh CLI (Windows)

`gh` is not on the default bash PATH. Prefix every session:

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
```

## Branching Strategy

### Branch Naming

Every issue gets its own branch:

```
main                          ← stable, always runnable
└── phase/<number>-<slug>     ← e.g. phase/1-foundation
└── feature/<slug>            ← bug fixes or unplanned work
```

### Flow per Issue

```bash
git checkout -b phase/1-foundation   # create branch for the issue
# do the work, commit often
gh pr create --title "Phase 1 – Foundation" --body "Closes #1"
# merge to main via squash merge after npm test passes
```

PR body must contain `Closes #<n>` — the issue auto-closes on merge.

### Commit Message Convention

```
feat: add CurrencySystem with silver/gold conversion
test: add unit tests for InventoryManager equip slots
fix: hero stops at collision tiles correctly
chore: update CLAUDE.md with save state shape
```

### Rules
- `main` is never broken — only merge when `npm test` passes
- One branch per issue — never bundle multiple phases into one branch
- Delete branches after merge
- `node_modules/` is git-ignored — never commit it

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
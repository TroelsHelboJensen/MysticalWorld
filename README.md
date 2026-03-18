# MysticalWorld

A top-down RPG inspired by *The Legend of Zelda: A Link to the Past*, built with [Phaser 3](https://phaser.io/) and vanilla JavaScript.

## How to run

No build step required. Open `index.html` directly in a browser, or serve it locally for full ES-module support:

```bash
npm start          # serves on http://localhost:8080
```

## Running tests

```bash
npm install        # first time only

npm test           # unit + integration tests (Vitest)
npm run test:watch # re-runs on file change
npm run test:e2e   # end-to-end tests (Playwright) — requires npm start
npm run test:all   # everything
```

## Project structure

```
index.html              Game entry point
css/ui.css              Styles for HTML overlays
js/main.js              Phaser game config + bootstrap
characters/             Hero, NPCs, enemies (pure-JS logic classes)
maps/                   Map data and MapManager
ui/                     HUD, inventory, dialogue (Phaser scene overlays)
persistence/            Save/load system
assets/                 Sprites, tilesets, sounds
tests/                  unit/, integration/, e2e/
```

## Controls

| Action | Keys |
|--------|------|
| Move | Arrow keys or WASD |
| Attack (sword swing) | Space or Z |
| Quick save | F5 |
| Quick load | F9 |

## Architecture

Game logic lives in **pure JS classes** with zero Phaser dependency. Phaser scenes are thin rendering/input wrappers that call the logic classes. This keeps all business logic unit-testable with Vitest + jsdom.

## Development progress

| Milestone | Phases | Status |
|-----------|--------|--------|
| M1 – Playable Foundation | 1 · 2 · 3 · 4 · CLAUDE.md | 🔄 Phase 1 in review |
| M2 – Core RPG Systems | 5 · 6 · 7 · 8 · 9 | ⏳ Pending |
| M3 – Full UI | 10 · 11 · 12 · 13 | ⏳ Pending |
| M4 – World & Dungeons | 14 · 15 | ⏳ Pending |
| M5 – Polish & E2E | 16 · 17 | ⏳ Pending |

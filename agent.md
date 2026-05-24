# Agent Developer Guide: Sonar Escape

This document provides a technical handoff for AI agents continuing development on the **Sonar Escape** project.

## Project Structure

- `server.js`: Node.js/Express backend handling static file serving and high-score API.
- `public/`:
    - `index.html`: Main game container and HUD structure.
    - `style.css`: Responsive layout, HUD styling, and mobile control overlays.
    - `game.js`: Monolithic game engine containing physics, rendering, audio, and state management.
- `data/scores.json`: Persistent storage for the leaderboard.

## Core Systems (in `game.js`)

### 1. State Management
The game uses a global state pattern. Key variables:
- `gameState`: Controls the overlay visibility (`start`, `playing`, `over`).
- `player`: Object tracking position (`x`, `y`), velocity (`vx`, `vy`), `radius`, `angle`, and `invulnTimer`.
- `pings`, `wakes`, `mines`, `torpedoes`, `surfaceShips`, `depthCharges`: Arrays managing active entities.

### 2. Rendering Engine (`drawScene`)
- **Dynamic Scaling:** The game uses a `cellSize` variable calculated in `resizeCanvas`. All rendering coordinates and sizes should be relative to `cellSize`.
- **Sonar Lighting:** Walls and objects are rendered based on their proximity to active `pings`. The brightness is calculated using the distance from the ping ring radius.
- **Submarine Rotation:** Handled via `ctx.save()`, `ctx.translate()`, and `ctx.rotate()`. Note the "moving left" logic which flips the sub horizontally (`ctx.scale(-1, 1)`) to keep it upright.
- **Surface Ambient Light:** The top of the map has a blue gradient (`surfaceDepth = cellSize * 2.5`) providing partial visibility without pings.

### 3. Physics & Collision (`handlePhysics`)
- **Movement:** Uses an acceleration/friction model to simulate water resistance.
- **Scale Independence:** All physics constants (acceleration, speeds, collision radii) are multiplied by `cellSize` to ensure consistent gameplay across all screen resolutions.
- **AABB Collision:** The player and projectiles check against the `maze` grid using the `getCell` helper.
- **Circular Collision:** Collision between the player and mines/depth charges uses a simple hypotenuse distance check.

### 4. Audio Engine
- Uses the **Web Audio API**. 
- SFX are synthesized on the fly (Sine, Triangle, Square, and Sawtooth oscillators).
- Audio context must be resumed on a user gesture (`initAudio` called in `initGame`).

### 5. Input & Mobile Overlay
- **Virtual Joystick:** A custom touch-to-direction implementation mapping to the `keys` object.
- **Action Buttons:** Dedicated `touchstart` listeners for PING and FIRE.
- **Typing Effect:** `showMissionBriefing` uses an `async` loop with `setTimeout` to render mission text.

## API Endpoints

- `GET /api/scores`: Returns an array of the top 10 scores (sorted by time ascending).
- `POST /api/scores`: Accepts `{ name, score }`. Sanitizes name length and sorts the persistent JSON store.

## Planned Improvements / Roadmap

1. **Procedural Maze Generation:** Replace the `rawMaze` constant with an algorithm (e.g., Prim's or Recursive Backtracking) to increase replayability.
2. **Entity Component System (ECS):** Refactor the monolithic game loop into an ECS for better management of multiple enemy types.
3. **Enhanced Particle Effects:** Implement a more robust particle system for explosions and the submarine wake.
4. **Levels & Progression:** Transition from a single-maze model to a multi-level campaign with increasing difficulty.

## Coding Conventions

- **Responsive First:** Never use hardcoded pixel values for game logic. Always use `cellSize` multipliers.
- **Native over Libraries:** Maintain the project's dependency-free frontend approach.
- **Commit Often:** Every logical feature or bug fix should be its own atomic commit.

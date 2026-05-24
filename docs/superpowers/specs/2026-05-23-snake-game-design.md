# Snake Game with Leaderboard Design

## Overview
A simple, fast-to-build, browser-based Snake game. It features a Node.js/Express backend that serves the static frontend files and manages a high-score leaderboard using a simple JSON file for storage.

## Architecture
- **Frontend:** HTML5, CSS3, Vanilla JavaScript. Uses the Canvas API for rendering the game.
- **Backend:** Node.js with Express framework.
- **Data Storage:** A simple flat file (`data/scores.json`) to persist the top 10 scores, keeping the implementation extremely fast.

## Components
1. **Frontend: Game Engine (`public/game.js`)**
   - Canvas rendering loop.
   - Core mechanics: movement, collision detection (walls and self), apple consumption, score tracking.
   - Input handling (arrow keys / WASD).
2. **Frontend: UI & API Client (`public/index.html`, `public/style.css`)**
   - Game canvas container.
   - Current score display.
   - Leaderboard UI.
   - Game Over screen with name input for high scores.
3. **Backend: API Server (`server.js`)**
   - Serves static files from the `public/` directory.
   - `GET /api/scores`: Reads and returns the top 10 scores.
   - `POST /api/scores`: Accepts `{ name: string, score: number }`. Validates input, adds to the list, sorts descending, truncates to top 10, and saves to `data/scores.json`.

## Data Flow
1. **Page Load:** Frontend requests `GET /api/scores` and populates the leaderboard.
2. **Gameplay:** Player controls the snake, score increases as apples are eaten.
3. **Game Over:** 
   - Game loop stops.
   - User is prompted for their name.
   - Frontend sends `POST /api/scores` with the final score.
   - Backend updates the JSON store.
   - Frontend re-fetches `GET /api/scores` to update the UI.

## Error Handling & Edge Cases
- **Missing Data File:** If `data/scores.json` doesn't exist, the backend should initialize it with an empty array.
- **Invalid API Payload:** Backend must reject payloads with missing names, invalid scores (e.g., negative or non-numbers).
- **Network Failures:** If the backend is unreachable, the frontend should fail gracefully and allow the user to play offline (without saving scores).
# Specification: Fluid Grid Scaling & Dynamic Viewport Fit

## Goal
Enable the game to fill 100% of the available screen space on any device (desktop, mobile, tablet) by dynamically calculating the grid size based on the viewport dimensions.

## Requirements
- The game canvas must always fill the available screen space without letterboxing.
- The number of maze columns and rows must be calculated dynamically based on the canvas size.
- Maintain a consistent "feel" by keeping the cell size within a legible range (e.g., 40-60 pixels).
- Tactical HUD elements must remain pinned to the corners of the viewport.
- Entity coordinates must remain stable during window resizing.

## Proposed Changes

### 1. CSS Refactor (`public/style.css`)
- Remove fixed aspect ratio (`20 / 15`) and max-width/max-height constraints from `.game-area`.
- Update `.game-area` to use `width: 100%` and `height: 100%` (or `flex: 1`) to fill the container.
- Ensure `canvas#gameCanvas` remains `width: 100%` and `height: 100%`.

### 2. JavaScript Logic (`public/game.js`)
- **Grid Initialization:**
  - Change `mazeCols` and `mazeRows` from constants to variables.
  - In `initGame`, calculate the initial grid size based on the current window size.
- **Resize Handling:**
  - Update `resizeCanvas()` to recalculate the visible `mazeCols` and `mazeRows` when the window is resized.
  - The maze data itself will be generated to be large enough to cover the maximum possible screen size (e.g., 50x50) to avoid mid-game regeneration issues.
  - The game will "view" a centered portion of this larger grid.
  - On smaller screens, the view will be tighter; on larger screens, more of the maze will be visible.
- **Entity Normalization:**
  - Entity positions will be updated relative to the new pixel-to-grid mapping.

### 3. UI/UX
- Keep the Tactical HUD in the corners using `position: absolute`.
- Ensure menu overlays (`ui-layer`) use `overflow-y: auto` to handle cases where the screen is very short (e.g., mobile landscape).

## Success Criteria
- No black bars (letterboxing) on any screen size.
- The game fills the entire browser window or mobile screen.
- Resizing the window does not break the game state or move the player into a wall.

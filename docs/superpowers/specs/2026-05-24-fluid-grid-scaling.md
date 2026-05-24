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
  - Update `resizeCanvas()` to recalculate the visible `viewCols` and `viewRows` when the window is resized.
  - The maze data itself is generated at 60x60 cells to cover all standard screen sizes.
  - The game uses a centered camera viewport that follows the player.
  - Spatial culling is used in the rendering loop to only draw visible cells, optimizing performance for the larger grid.
- **Entity Normalization:**
  - Entity positions use absolute world coordinates; since `cellSize` is fixed (50px), they remain stable during resizing without needing manual recalculation.

### 3. UI/UX
- Keep the Tactical HUD in the corners using `position: absolute`.
- Ensure menu overlays (`ui-layer`) use `overflow-y: auto` to handle cases where the screen is very short (e.g., mobile landscape).

## Success Criteria
- No black bars (letterboxing) on any screen size.
- The game fills the entire browser window or mobile screen.
- Resizing the window does not break the game state or move the player into a wall.

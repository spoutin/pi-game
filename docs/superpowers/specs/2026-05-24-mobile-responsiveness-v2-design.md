# Spec: Mobile Responsiveness Fix (Viewport-Locked Scaling)

## Overview
Address the issue where the game board and UI buttons are inaccessible or cut off on mobile devices. The core strategy is to switch from a fluid-but-unconstrained layout to a viewport-locked scaling system that treats the game UI as a single unit that must fit within `100vw` and `100vh`.

## Design

### 1. Viewport-Locked Wrapper
- **CSS Constraint:** The `.container` and `.game-wrapper` will use `height: 100vh` and `width: 100vw` with `overflow: hidden` to prevent any scrolling.
- **Scaling Logic:**
    - On mobile landscape, the `.game-wrapper` will use `flex-direction: row`.
    - The `.game-area` (containing the canvas and all UI overlays) will use `aspect-ratio: 20 / 15` (matching the maze dimensions).
    - We will use `max-width: 100%` and `max-height: 100%` on the game components to ensure they shrink to the smallest dimension of the screen.

### 2. UI Overlay Synchronization
- All overlays (`#uiOverlay`, `#gameOverScreen`, `#settingsOverlay`) must be contained within the `.game-area`.
- Their font sizes and padding will use relative units (like `vmin`) so they scale proportionally when the game board shrinks.
- This ensures that "Start Mission" and "Save Time" buttons are always visible and clickable if the game board itself is visible.

### 3. Canvas & JS Integration
- `resizeCanvas` in `game.js` will be simplified:
    - It will measure the `clientWidth` and `clientHeight` of the parent `.game-area`.
    - It will set the canvas internal resolution (`width`, `height`) to match the rendered size.
    - It will recalculate `cellSize` based on the final width.
- This removes the "tug-of-war" between JS calculations and CSS constraints.

### 4. Mobile Controls (Z-Index and Positioning)
- `#mobile-controls` will be moved to be direct children of the `body` or a fixed-position full-screen layer.
- This ensures they are always at the bottom corners of the *physical screen*, not the game board, providing consistent thumb placement.
- They will use a high `z-index` to float above all game elements.

## Success Criteria
- [ ] Game is completely contained within the mobile viewport (no overflow).
- [ ] All UI buttons (Start, Restart, Settings) are visible and clickable on mobile landscape.
- [ ] Game map remains centered and correctly proportioned (20:15).
- [ ] Touch controls are consistently positioned in the screen corners regardless of game board scaling.

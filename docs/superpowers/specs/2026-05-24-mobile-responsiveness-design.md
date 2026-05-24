# Spec: Mobile Responsiveness and Orientation Strategy

## Overview
Improve the mobile gameplay experience by enforcing landscape orientation and implementing a responsive "Side HUD" layout. This ensures the maze (20:15 aspect ratio) remains playable and legible on small screens.

## Design

### 1. Orientation Enforcement
- **Portrait Detection:** A full-screen overlay will be displayed when a mobile device is in portrait orientation.
- **Visuals:** The overlay will feature a "Rotate Device" icon and a text prompt ("Please rotate your device to landscape for the best experience").
- **Implementation:** CSS `@media (orientation: portrait)` combined with a `z-index` layer.

### 2. Side HUD Layout (Mobile Landscape)
- **Responsive Transition:** On screens where the aspect ratio is wide (landscape) and space is limited (mobile), the HUD will shift from a top/bottom bar to two side panels.
- **Left Panel:** Contains Health (hearts) and Mission Time.
- **Right Panel:** Contains Ping count/penalty and Torpedo reload status.
- **Center:** The game canvas will be centered between these panels, scaling to fill the remaining width and height.

### 3. Responsive Scaling
- **Viewport Units:** Use `vw` and `vh` for UI elements to ensure they scale proportionally with the screen size.
- **Canvas Scaling:** The `resizeCanvas` function in `game.js` will be updated to account for the side HUD panels when calculating the available area for the maze.

### 4. Touch Controls
- **Joystick:** Positioned in the bottom-left corner of the map area.
- **Action Buttons (Ping/Fire):** Positioned in the bottom-right corner.
- **Scaling:** Button sizes will adjust based on the screen height to prevent "crushing" on small devices.

## Success Criteria
- [ ] Game is unplayable in portrait mode with a clear instruction to rotate.
- [ ] Game map automatically expands to fill the landscape screen.
- [ ] HUD elements are legible and do not overlap the game map on mobile.
- [ ] Touch controls are comfortably sized for thumb interaction.

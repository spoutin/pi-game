# Spec: Sonar Escape Tactical HUD & Unified Scaling

## Overview
Redesign the game layout to maximize playable area and ensure UI accessibility across all devices. This is achieved by moving the HUD elements into a tactical overlay and implementing a strict "Safe-Container" scaling model.

## Design

### 1. Tactical HUD Overlay
- **Layout:** Remove the top and bottom HUD bars.
- **Floating Panels:**
    - **Top-Left:** Health status and Mission Timer.
    - **Top-Right:** Ping counter and Torpedo reload indicator.
- **Style:** Semi-transparent dark backgrounds with neon green text, matching the submarine radar aesthetic. HUD elements will use `position: absolute` within the `.game-area`.

### 2. Unified Game Area Scaling
- **Constraint:** The `.game-area` is the master container. It will use `aspect-ratio: 20 / 15` and be limited to `90dvh` and `95vw`.
- **Centering:** The entire game unit will be centered in the viewport.
- **Canvas Resolution:** The JavaScript `resizeCanvas` will continue to match the canvas internal resolution to the `.game-area`'s CSS-calculated size.

### 3. Flexible UI Overlays (Menu System)
- **Centering:** Use strict Flexbox centering for all menu content.
- **Safe-Overflow:** Set `overflow-y: auto` and `justify-content: center` (via the margin:auto trick) to ensure that if the screen is too short, the user can scroll to see the "Start Mission" and other action buttons.
- **Typography:** Standardize font sizes using `clamp()` to ensure readability on small screens without overwhelming desktop users.

## Success Criteria
- [ ] No more than 5% of the screen is "wasted" on non-playable bars.
- [ ] "Start Mission" button is visible and clickable on all standard desktop and mobile resolutions.
- [ ] HUD elements are legible against the game background.
- [ ] Game maintains a sharp, consistent 4:3 aspect ratio.

# Mobile Responsiveness Fix (Viewport-Locked Scaling) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile accessibility issues by implementing a viewport-locked scaling system that ensures the game fits perfectly on any screen size.

**Architecture:** Use CSS `aspect-ratio` and `max-width: 100% / max-height: 100%` on the game area to force it into the viewport. Simplify JavaScript `resizeCanvas` to match the CSS-driven dimensions.

**Tech Stack:** HTML, CSS, Vanilla JavaScript.

---

### Task 1: Restructure HTML for Better Containment

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Move HUD elements inside game-area**

Move `#hud-left` and `#hud-right` inside the `.game-area` div so they scale with the game board.

```html
<!-- Inside public/index.html -->
<div class="container">
    <div class="game-wrapper">
        <div class="game-area">
            <div id="hud-left" class="hud-side">
                <div class="hud-item"><span>HEALTH:</span> <span id="healthCount">♥♥♥</span></div>
                <div class="hud-item"><span>TIME:</span> <span id="currentTime">0.0</span>s</div>
            </div>
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            <!-- ... existing overlays ... -->
            <div id="hud-right" class="hud-side">
                <div class="hud-item"><span>PINGS:</span> <span id="pingCount">Unlimited</span></div>
                <div class="hud-item"><span>TORPEDO:</span> <canvas id="torpedoUICanvas" width="40" height="15"></canvas></div>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Verify HTML structure**

Check that `#hud-left` and `#hud-right` are now siblings of `canvas` inside `.game-area`.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "refactor: move HUD elements inside game-area for scaling"
```

### Task 2: Implement Viewport-Locked CSS

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Lockdown the container**

Force the container to be exactly 100% of the viewport and prevent scrolling.

```css
/* Update public/style.css */
body {
    overflow: hidden;
    height: 100vh;
    width: 100vw;
}

.container {
    padding: 0;
    gap: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
}
```

- [ ] **Step 2: Define Game Area Aspect Ratio**

Set the `.game-area` to maintain the 20:15 aspect ratio and shrink to fit.

```css
/* Update public/style.css */
.game-area {
    position: relative;
    display: flex;
    flex-direction: column; /* Default portrait/desktop */
    aspect-ratio: 20 / 15;
    max-width: 100vw;
    max-height: 100vh;
    border: none;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    background: #000;
}

@media (orientation: landscape) {
    .game-area {
        flex-direction: row;
        aspect-ratio: 24 / 15; /* Account for side HUDs */
    }
}
```

- [ ] **Step 3: Update HUD Styles**

Make HUDs relative to the game area.

```css
/* Update public/style.css */
.hud-side {
    background: rgba(10, 10, 26, 0.9);
    padding: 5px 10px;
    font-size: 2vmin; /* Scalable font */
    z-index: 10;
}

@media (orientation: landscape) {
    .hud-side {
        width: 15%;
        height: 100%;
        flex-direction: column;
        justify-content: center;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add public/style.css
git commit -m "feat: implement viewport-locked CSS scaling"
```

### Task 3: Simplify JavaScript Resize Logic

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Simplify resizeCanvas**

Make JS follow the CSS-calculated size of the `.game-area`.

```javascript
// Inside public/game.js
function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    const hudLeft = document.getElementById('hud-left');
    const hudRight = document.getElementById('hud-right');
    
    // Calculate available width for canvas (total width minus side HUDs in landscape)
    const isLandscape = window.innerWidth > window.innerHeight;
    const sideHudWidth = isLandscape ? (hudLeft.offsetWidth + hudRight.offsetWidth) : 0;
    const topHudHeight = !isLandscape ? (hudLeft.offsetHeight + hudRight.offsetHeight) : 0;

    canvas.width = gameArea.clientWidth - sideHudWidth;
    canvas.height = gameArea.clientHeight - topHudHeight;
    
    cellSize = canvas.width / mazeCols;
    joystickMaxDist = Math.min(canvas.width, canvas.height) * 0.1;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/game.js
git commit -m "refactor: simplify resizeCanvas to follow CSS dimensions"
```

### Task 4: Fix Overlay and Control Scaling

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Update UI Overlay sizes**

Ensure overlays use `vmin` for fonts and padding.

```css
/* Update public/style.css */
.ui-layer, .overlay {
    font-size: 2.5vmin;
}

.ui-layer h1 { font-size: 6vmin; }
.ui-layer button { font-size: 4vmin; padding: 2vmin 4vmin; }

#mobile-controls {
    position: fixed; /* Lock to screen corners */
    bottom: 5vmin;
    left: 5vmin;
    right: 5vmin;
    z-index: 2000;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/style.css
git commit -m "feat: scale UI overlays and mobile controls with vmin"
```

# Tactical HUD and Unified Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the game layout to use corner-based tactical overlays for the HUD and implement robust, scroll-safe menu scaling.

**Architecture:** Move HUD elements inside the `.game-area`, use `position: absolute` for HUD panels, and apply `clamp()` and `overflow-y: auto` to menus.

**Tech Stack:** HTML5, CSS3, Vanilla JS.

---

### Task 1: Refactor HTML for Tactical HUD

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Move HUD elements into unified panels**

Move `#hud-left` and `#hud-right` children into new tactical panels inside `.game-area`.

```html
<!-- Inside public/index.html, within .game-area -->
<div class="tactical-hud">
    <div class="hud-panel top-left">
        <div class="hud-item"><span>HEALTH:</span> <span id="healthCount">♥♥♥</span></div>
        <div class="hud-item"><span>TIME:</span> <span id="currentTime">0.0</span>s</div>
    </div>
    <div class="hud-panel top-right">
        <div class="hud-item"><span>PINGS:</span> <span id="pingCount">Unlimited</span></div>
        <div class="hud-item"><span>TORPEDO:</span> <canvas id="torpedoUICanvas" width="40" height="15"></canvas></div>
    </div>
</div>
```

- [ ] **Step 2: Remove old HUD structures**

Remove any remaining `#hud-left` and `#hud-right` outside the `.game-area` if they still exist.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "refactor: restructure HTML for tactical HUD overlays"
```

---

### Task 2: Implement Tactical HUD Styling

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Style the Tactical Panels**

Position the panels in the corners of the game area.

```css
/* Inside public/style.css */
.tactical-hud {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; /* Allow clicks to pass to canvas/menus */
    z-index: 50;
}

.hud-panel {
    position: absolute;
    background: rgba(0, 10, 5, 0.6);
    padding: 1vmin 2vmin;
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 0.5vmin;
    pointer-events: auto;
}

.top-left { top: 1vmin; left: 1vmin; }
.top-right { top: 1vmin; right: 1vmin; }
```

- [ ] **Step 2: Refine HUD Item sizing**

```css
.hud-item {
    font-size: clamp(12px, 1.8vmin, 18px);
    font-weight: bold;
    color: #4CAF50;
    text-shadow: 0 0 5px #000;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/style.css
git commit -m "feat: style tactical HUD panels"
```

---

### Task 3: Unified Canvas Scaling and Container Lock

**Files:**
- Modify: `public/style.css`
- Modify: `public/game.js`

- [ ] **Step 1: Lockdown the Game Area**

```css
/* Inside public/style.css */
.game-area {
    position: relative;
    aspect-ratio: 20 / 15;
    max-width: 95vw;
    max-height: 90dvh;
    border: 2px solid #333;
    box-shadow: inset 0 0 15px #4CAF50;
    background: #000;
}
```

- [ ] **Step 2: Update resizeCanvas in JS**

```javascript
/* Inside public/game.js */
function resizeCanvas() {
    if (!gameArea) return;
    const rect = gameArea.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    cellSize = canvas.width / mazeCols;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/style.css public/game.js
git commit -m "feat: implement unified scaling and aspect ratio lock"
```

---

### Task 4: Robust Menu Scaling and Overflow

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Update Overlays for better fit**

```css
/* Inside public/style.css */
.ui-layer, .overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start; /* Safety for small screens */
    gap: 2vmin;
    background: rgba(0,0,0,0.85);
    padding: 3vmin;
    z-index: 100;
    overflow-y: auto;
}

/* Vertical centering that allows scrolling */
.ui-layer::before, .ui-layer::after, .overlay::before, .overlay::after {
    content: '';
    margin: auto;
}

.ui-layer h1 { font-size: clamp(24px, 5vmin, 50px); }
.instructions { font-size: clamp(10px, 1.4vmin, 14px); max-width: 500px; }
```

- [ ] **Step 2: Commit**

```bash
git add public/style.css
git commit -m "fix: ensure menu overlays are scroll-safe and responsive"
```

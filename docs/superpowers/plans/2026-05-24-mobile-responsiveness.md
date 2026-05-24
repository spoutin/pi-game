# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce landscape orientation on mobile and implement a responsive "Side HUD" layout to maximize playable maze area.

**Architecture:** Use CSS media queries (`orientation: portrait`) to trigger a rotation overlay, and flexbox restructuring to move HUD elements to the sides in landscape mode. Update the game's resizing logic to account for these dynamic layouts.

**Tech Stack:** Vanilla JS, CSS3, HTML5 Canvas.

---

### Task 1: Orientation Overlay and HUD Restructuring

**Files:**
- Modify: `public/index.html`
- Modify: `public/style.css`

- [ ] **Step 1: Add orientation overlay to index.html**
Insert the overlay after the `game-area` div.
```html
<div id="orientationOverlay" class="hidden overlay orientation-layer">
    <div class="orientation-box">
        <div class="rotate-icon">📱</div>
        <h2>PLEASE ROTATE DEVICE</h2>
        <p>This mission requires landscape orientation for optimal sonar operations.</p>
    </div>
</div>
```

- [ ] **Step 2: Update HUD structure in index.html**
Restructure `#hud-panel` to use containers for better side-stacking control.
```html
<div id="hud-panel">
    <div id="hud-left" class="hud-side">
        <div class="hud-item"><span>HEALTH:</span> <span id="healthCount">♥♥♥</span></div>
        <div class="hud-item"><span>TIME:</span> <span id="currentTime">0.0</span>s</div>
    </div>
    <div id="hud-right" class="hud-side">
        <div class="hud-item"><span>PINGS:</span> <span id="pingCount">Unlimited</span></div>
        <div class="hud-item"><span>TORPEDO:</span> <canvas id="torpedoUICanvas" width="40" height="15"></canvas></div>
    </div>
</div>
```

- [ ] **Step 3: Add CSS for orientation overlay and side HUD in style.css**
Add orientation detection and landscape side-bar styles.
```css
/* Portrait Orientation Overlay */
@media (orientation: portrait) and (max-width: 1024px) {
    #orientationOverlay {
        display: flex !important;
        z-index: 1000;
        background: #050510;
        color: #4CAF50;
        flex-direction: column;
    }
    .rotate-icon {
        font-size: 80px;
        margin-bottom: 20px;
        animation: rotate-anim 2s infinite;
    }
}
@keyframes rotate-anim {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(90deg); }
    100% { transform: rotate(0deg); }
}

/* Side HUD for Mobile Landscape */
@media (max-height: 500px) and (orientation: landscape) {
    .container {
        padding: 0;
        gap: 0;
    }
    .game-wrapper {
        flex-direction: row !important;
        height: 100vh;
        width: 100vw;
        justify-content: center;
    }
    #hud-panel {
        flex-direction: column;
        width: 100px;
        height: 100%;
        padding: 10px 5px;
        box-sizing: border-box;
        font-size: 14px;
        border: none;
        border-right: 2px solid #333;
        background: #0a0a1a;
    }
    #hud-left {
        flex-direction: column;
        justify-content: center;
        height: 50%;
        gap: 20px;
    }
    #hud-right {
        order: 3;
        flex-direction: column;
        justify-content: center;
        height: 50%;
        gap: 20px;
        border-left: 2px solid #333;
    }
    .game-area {
        flex-grow: 1;
        height: 100%;
        border: none;
        max-width: calc(100vw - 200px);
    }
    .hud-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
        text-align: center;
        align-items: center;
    }
}
```

- [ ] **Step 4: Commit**
```bash
git add public/index.html public/style.css
git commit -m "feat: add orientation overlay and side HUD structure"
```

### Task 2: Responsive Canvas and Scaling

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Update resizeCanvas for side HUDs**
Modify `resizeCanvas` to deduct HUD width from available space when in small landscape mode.
```javascript
function resizeCanvas() {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallLandscape = isMobile && isLandscape && window.innerHeight < 500;

    let hudWidth = 0;
    let padding = isMobile ? 5 : 20;
    
    if (isSmallLandscape) {
        hudWidth = 200; // 100px left + 100px right
        padding = 0;
    }

    const availableWidth = window.innerWidth - padding * 2 - hudWidth;
    const availableHeight = window.innerHeight - (isSmallLandscape ? 0 : (isMobile ? 100 : 160));
    
    let newWidth = availableWidth; 
    let newHeight = availableWidth * (mazeRows / mazeCols);
    
    if (newHeight > availableHeight) { 
        newHeight = availableHeight; 
        newWidth = availableHeight * (mazeCols / mazeRows); 
    }
    
    if (!isMobile && newWidth > 1200) { 
        newWidth = 1200; 
        newHeight = 1200 * (mazeRows / mazeCols); 
    }
    
    canvas.width = newWidth; 
    canvas.height = newHeight; 
    cellSize = canvas.width / mazeCols;
}
```

- [ ] **Step 2: Commit**
```bash
git add public/game.js
git commit -m "feat: make canvas resizing responsive to side HUD layout"
```

### Task 3: Touch Control Polish

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Scale down mobile controls for small landscape in style.css**
```css
@media (max-height: 500px) and (orientation: landscape) {
    #mobile-controls {
        bottom: 10px;
        padding: 0 10px;
        height: 100px;
        align-items: center;
    }
    #joystick-container {
        width: 80px;
        height: 80px;
    }
    #joystick-base {
        width: 70px;
        height: 70px;
    }
    #joystick-knob {
        width: 35px;
        height: 35px;
    }
    .action-btn {
        width: 60px;
        padding: 8px;
        font-size: 12px;
    }
}
```

- [ ] **Step 2: Final CSS clean up for hud-side items**
```css
.hud-side {
    display: flex;
    align-items: center;
    gap: 15px;
}
```

- [ ] **Step 3: Commit**
```bash
git add public/style.css
git commit -m "feat: polish mobile controls and HUD scaling"
```

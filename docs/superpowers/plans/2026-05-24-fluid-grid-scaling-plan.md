# Fluid Grid Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement fluid grid scaling so the game fills 100% of the viewport and dynamically adjusts the visible maze area.

**Architecture:**
- Decouple `mazeCols` and `mazeRows` from the screen size by generating a large "world" maze (e.g., 60x60).
- Dynamically calculate the visible `viewCols` and `viewRows` in `resizeCanvas`.
- Center the view on the player and handle coordinate normalization during window resize.

**Tech Stack:** Vanilla JavaScript, CSS Flexbox/Grid, Canvas API.

---

### Task 1: CSS Refactor for Full-Screen Growth

**Files:**
- Modify: `public/style.css`

- [ ] **Step 1: Remove aspect ratio and size constraints**
Remove the fixed `aspect-ratio` and `max-width`/`max-height` from `.game-area` to allow it to expand to fill available space.

```css
/* Change this: */
.game-area {
    position: relative;
    background-color: #000;
    border: 2px solid #333;
    box-shadow: 0 0 15px #4CAF50;
    aspect-ratio: 20 / 15;
    max-width: 95vw;
    max-height: 90dvh;
    margin: 0 auto;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* To this: */
.game-area {
    position: relative;
    background-color: #000;
    border: 2px solid #333;
    box-shadow: 0 0 15px #4CAF50;
    flex: 1; /* Grow to fill container */
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}
```

- [ ] **Step 2: Update container for flex-grow**
Ensure the `.container` and `.game-wrapper` allow the `.game-area` to expand fully.

```css
.container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0; /* Remove padding for true edge-to-edge */
}

.game-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    height: 100%;
    align-items: stretch; /* Stretch to fill */
}
```

- [ ] **Step 3: Commit CSS changes**
```bash
git add public/style.css
git commit -m "style: remove fixed aspect ratio and allow full-screen growth"
```

---

### Task 2: Large World Generation

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Define world and view dimensions**
Update variable declarations to distinguish between the large generated maze and the currently visible area.

```javascript
// Change these declarations:
let cellSize = 40;
const mazeCols = 20; // These will now be worldCols
const mazeRows = 15; // These will now be worldRows
let maze = [];

// To:
let cellSize = 50; // Target size
let worldCols = 60; // Large enough for any screen
let worldRows = 60;
let viewCols = 20;
let viewRows = 15;
let maze = [];
```

- [ ] **Step 2: Update generateMaze for world dimensions**
Update `generateMaze` and `initGame` to use `worldCols` and `worldRows`.

```javascript
// In initGame:
maze = generateMaze(worldCols, worldRows);
// ... update mine placement to use worldCols/Rows
```

- [ ] **Step 3: Commit world generation changes**
```bash
git add public/game.js
git commit -m "feat: implement large world generation"
```

---

### Task 3: Dynamic Resize & Viewport Calculation

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Rewrite resizeCanvas**
Calculate `viewCols` and `viewRows` dynamically and keep the `cellSize` consistent.

```javascript
function resizeCanvas() {
    if (!gameArea) return;
    
    const rect = gameArea.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Maintain a consistent cell size rather than scaling it
    // cellSize = 50; 
    
    viewCols = Math.ceil(canvas.width / cellSize);
    viewRows = Math.ceil(canvas.height / cellSize);
    
    // Handle entity normalization if needed, but since cellSize is fixed,
    // coordinates stay stable relative to cell [0,0]
}
```

- [ ] **Step 2: Commit resize logic**
```bash
git add public/game.js
git commit -m "feat: dynamic viewport calculation in resizeCanvas"
```

---

### Task 4: Centered Viewport Rendering

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Center the camera on the player**
Modify `drawScene` and `getCell` to account for the viewport's offset relative to the player.

```javascript
// Calculate offsets so player stays centered
let offsetX = player.x - canvas.width / 2;
let offsetY = player.y - canvas.height / 2;

// Update drawing loops to use these offsets
// ctx.translate(-offsetX, -offsetY);
```

- [ ] **Step 2: Final verification**
Run the game, resize the window, and ensure the maze fills the screen and the player stays centered.

- [ ] **Step 3: Commit final changes**
```bash
git add public/game.js
git commit -m "feat: implement centered viewport camera"
```

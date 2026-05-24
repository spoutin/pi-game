# Large World Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple maze generation from the screen size by creating a fixed 60x60 "world" maze.

**Architecture:** Replace `mazeCols` and `mazeRows` with `worldCols` and `worldRows` (60x60). Introduce `viewCols` and `viewRows` for screen scaling.

**Tech Stack:** JavaScript (Canvas API)

---

### Task 1: Update Global Variables

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Update maze dimensions and add view dimensions**

Replace lines 62-63 and update 61.

```javascript
61: let cellSize = 50;
62: const worldCols = 60;
63: const worldRows = 60;
64: const viewCols = 20;
65: const viewRows = 15;
```

- [ ] **Step 2: Commit**

```bash
git add public/game.js
git commit -m "feat: update world dimensions constants"
```

### Task 2: Update Initialization and Scaling

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Update `resizeCanvas` to use `viewCols`**

```javascript
// Line 421
cellSize = canvas.width / viewCols;
```

- [ ] **Step 2: Update `initGame` to use `worldCols` and `worldRows`**

```javascript
// Line 508
maze = generateMaze(worldCols, worldRows);
```

- [ ] **Step 3: Commit**

```bash
git add public/game.js
git commit -m "feat: use world dimensions for maze generation and scaling"
```

### Task 4: Verification

- [ ] **Step 1: Verify the game still initializes correctly**
Run the game and ensure it starts without errors. Note that the treasure will be far away and the camera won't follow yet.

- [ ] **Step 2: Commit (if any fixes were needed)**

# Snake Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Snake game with a Node.js/Express backend for saving high scores.

**Architecture:** A simple Express server serving a static HTML/JS/CSS frontend and providing a tiny JSON-backed REST API for top 10 scores.

**Tech Stack:** Node.js, Express, HTML5 Canvas, Vanilla JavaScript.

---

### Task 1: Setup Backend & Static File Server

**Files:**
- Create: `package.json`
- Create: `server.js`
- Create: `data/scores.json`

- [ ] **Step 1: Initialize project and install dependencies**

Run: `npm init -y && npm install express cors`

- [ ] **Step 2: Create initial data file**

Run: `mkdir -p data && echo "[]" > data/scores.json`

- [ ] **Step 3: Write the Express Server**

Create `server.js` with:
```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SCORES_FILE = path.join(__dirname, 'data', 'scores.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/scores', (req, res) => {
    if (!fs.existsSync(SCORES_FILE)) {
        return res.json([]);
    }
    const scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
    res.json(scores);
});

app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    
    let scores = [];
    if (fs.existsSync(SCORES_FILE)) {
        scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
    }
    
    scores.push({ name: name.substring(0, 20), score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Keep top 10
    
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
    res.json(scores);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 4: Commit Backend setup**
```bash
git add package.json package-lock.json server.js data/scores.json
git commit -m "feat: setup express backend and scores api"
```

---

### Task 2: Build Frontend Layout & Styling

**Files:**
- Create: `public/index.html`
- Create: `public/style.css`

- [ ] **Step 1: Write HTML layout**

Create `public/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snake Game</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Snake</h1>
        <div class="game-area">
            <canvas id="gameCanvas" width="400" height="400"></canvas>
            <div id="gameOverScreen" class="hidden overlay">
                <h2>Game Over!</h2>
                <p>Score: <span id="finalScore"></span></p>
                <input type="text" id="playerName" placeholder="Enter Name (max 20 chars)" maxlength="20">
                <button id="saveScoreBtn">Save Score</button>
                <button id="restartBtn">Play Again</button>
            </div>
        </div>
        
        <div class="score-board">
            <h2>Current Score: <span id="currentScore">0</span></h2>
            <h3>Top 10 High Scores</h3>
            <ul id="leaderboard"></ul>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write CSS styling**

Create `public/style.css`:
```css
body {
    font-family: sans-serif;
    background-color: #2c3e50;
    color: white;
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 20px;
}
.container {
    display: flex;
    gap: 20px;
}
h1, h2, h3 { margin-top: 0; }
.game-area {
    position: relative;
    background-color: #34495e;
    border: 4px solid #ecf0f1;
    border-radius: 8px;
}
canvas {
    display: block;
    background-color: #000;
}
.overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.hidden { display: none !important; }
.score-board {
    background-color: #34495e;
    padding: 20px;
    border-radius: 8px;
    min-width: 200px;
}
ul { padding-left: 20px; }
button {
    padding: 10px 20px;
    cursor: pointer;
    background-color: #27ae60;
    color: white;
    border: none;
    border-radius: 4px;
}
button:hover { background-color: #2ecc71; }
input { padding: 10px; width: 80%; }
```

- [ ] **Step 3: Commit Frontend structure**
```bash
git add public/index.html public/style.css
git commit -m "feat: add frontend ui layout"
```

---

### Task 3: Implement Game Logic

**Files:**
- Create: `public/game.js`

- [ ] **Step 1: Write core game logic**

Create `public/game.js`:
```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('currentScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const playerNameInput = document.getElementById('playerName');
const leaderboardEl = document.getElementById('leaderboard');

const gridSize = 20;
let snake = [{x: 200, y: 200}];
let apple = {x: 100, y: 100};
let dx = 0;
let dy = -gridSize;
let score = 0;
let gameLoop;
let isGameOver = false;

function resetGame() {
    snake = [{x: 200, y: 200}];
    dx = 0; dy = -gridSize;
    score = 0;
    isGameOver = false;
    currentScoreEl.innerText = score;
    gameOverScreen.classList.add('hidden');
    spawnApple();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 100);
}

function spawnApple() {
    apple.x = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
    apple.y = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
}

function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
}

function update() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Wall collision
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        return gameOver();
    }
    
    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return gameOver();
    }
    
    snake.unshift(head);
    
    // Apple collision
    if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        currentScoreEl.innerText = score;
        spawnApple();
    } else {
        snake.pop();
    }
    
    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(apple.x, apple.y, 'red');
    snake.forEach((part, index) => {
        drawRect(part.x, part.y, index === 0 ? 'lightgreen' : 'green');
    });
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

// Controls
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -gridSize; }
    if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = gridSize; }
    if (e.key === 'ArrowLeft' && dx === 0) { dx = -gridSize; dy = 0; }
    if (e.key === 'ArrowRight' && dx === 0) { dx = gridSize; dy = 0; }
});

restartBtn.addEventListener('click', resetGame);
```

- [ ] **Step 2: Commit game logic**
```bash
git add public/game.js
git commit -m "feat: implement basic game mechanics"
```

---

### Task 4: Connect API & Finish

**Files:**
- Modify: `public/game.js`

- [ ] **Step 1: Append API Logic to game.js**

Run: `cat << 'EOF' >> public/game.js`
```javascript
// API integration
async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/scores');
        const scores = await res.json();
        leaderboardEl.innerHTML = '';
        scores.forEach(s => {
            const li = document.createElement('li');
            li.textContent = `${s.name}: ${s.score}`;
            leaderboardEl.appendChild(li);
        });
    } catch (e) { console.error('Error fetching scores:', e); }
}

saveScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim() || 'Anonymous';
    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score })
        });
        playerNameInput.value = '';
        await fetchLeaderboard();
        saveScoreBtn.disabled = true;
        saveScoreBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveScoreBtn.disabled = false;
            saveScoreBtn.textContent = 'Save Score';
        }, 2000);
    } catch (e) { console.error('Error saving score:', e); }
});

// Initial load
fetchLeaderboard();
resetGame();
```
Run the command: `EOF`

- [ ] **Step 2: Commit API integration**
```bash
git add public/game.js
git commit -m "feat: integrate leaderboard api"
```

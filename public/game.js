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

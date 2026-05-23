const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('uiOverlay');
const startBtn = document.getElementById('startBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const restartBtn = document.getElementById('restartBtn');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const playerNameInput = document.getElementById('playerName');
const leaderboardEl = document.getElementById('leaderboard');
const currentTimeEl = document.getElementById('currentTime');
const pingCountEl = document.getElementById('pingCount');
const difficultyRadios = document.getElementsByName('difficulty');

let gameState = 'start';
let player = { x: 50, y: 50, vx: 0, vy: 0, radius: 8 };
let keys = { w: false, a: false, s: false, d: false, space: false };
let pings = [];
let startTime = 0;
let timeElapsed = 0;
let lastFrame = performance.now();
let lastBump = 0;

let difficulty = 'easy';
let freePings = -1; // -1 means unlimited
let pingsUsed = 0;
let penaltyPerPing = 3;
let finalTotalScore = 0;

// Audio Context
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playPingSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playBumpSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playWinSound() {
    if (!audioCtx) return;
    const freqs = [440, 554, 659, 880];
    freqs.forEach((f, i) => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, audioCtx.currentTime + i*0.1);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + i*0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i*0.1 + 0.5);
        osc.start(audioCtx.currentTime + i*0.1);
        osc.stop(audioCtx.currentTime + i*0.1 + 0.5);
    });
}

// Simple Maze (1: wall, 0: open, 2: goal)
const cellSize = 40;
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,2,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1],
    [1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function initGame() {
    initAudio();
    
    // Set Difficulty
    for (const radio of difficultyRadios) {
        if (radio.checked) {
            difficulty = radio.value;
            break;
        }
    }
    
    if (difficulty === 'easy') freePings = -1;
    else if (difficulty === 'medium') freePings = 25;
    else if (difficulty === 'hard') freePings = 10;
    
    player = { x: 60, y: 60, vx: 0, vy: 0, radius: 8 };
    pings = [];
    pingsUsed = 0;
    startTime = Date.now();
    gameState = 'playing';
    
    updatePingHUD();
    
    uiOverlay.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lastFrame = performance.now();
    requestAnimationFrame(gameLoop);
}

function updatePingHUD() {
    if (freePings === -1) {
        pingCountEl.innerText = 'Unlimited';
        pingCountEl.style.color = '#4CAF50';
    } else {
        let remaining = freePings - pingsUsed;
        if (remaining >= 0) {
            pingCountEl.innerText = remaining;
            pingCountEl.style.color = '#4CAF50';
        } else {
            let penalty = Math.abs(remaining) * penaltyPerPing;
            pingCountEl.innerText = `0 (+${penalty}s)`;
            pingCountEl.style.color = '#ff5555';
        }
    }
}

function handlePings(dt) {
    if (keys.space) {
        if (pings.length === 0 || pings[pings.length-1].radius > 100) {
            pings.push({ x: player.x, y: player.y, radius: 0, maxRadius: 300, opacity: 1 });
            pingsUsed++;
            updatePingHUD();
            playPingSound();
        }
        keys.space = false;
    }

    for (let i = pings.length - 1; i >= 0; i--) {
        let p = pings[i];
        p.radius += 300 * dt; // speed of sound
        p.opacity -= 0.6 * dt; // fade rate
        if (p.opacity <= 0) pings.splice(i, 1);
    }
}

function getCell(x, y) {
    let col = Math.floor(x / cellSize);
    let row = Math.floor(y / cellSize);
    if (row < 0 || row >= maze.length || col < 0 || col >= maze[0].length) return 1;
    return maze[row][col];
}

function handlePhysics(dt, time) {
    const accel = 800;
    const friction = 0.85;
    let hitWall = false;

    if (keys.w) player.vy -= accel * dt;
    if (keys.s) player.vy += accel * dt;
    if (keys.a) player.vx -= accel * dt;
    if (keys.d) player.vx += accel * dt;

    player.vx *= friction;
    player.vy *= friction;

    let newX = player.x + player.vx * dt;
    let newY = player.y + player.vy * dt;

    // AABB Collision vs Map
    // X axis
    if (getCell(newX + Math.sign(player.vx)*player.radius, player.y) === 1 || 
        getCell(newX + Math.sign(player.vx)*player.radius, player.y - player.radius*0.8) === 1 ||
        getCell(newX + Math.sign(player.vx)*player.radius, player.y + player.radius*0.8) === 1) {
        player.vx = 0;
        hitWall = true;
    } else {
        player.x = newX;
    }

    // Y axis
    if (getCell(player.x, newY + Math.sign(player.vy)*player.radius) === 1 ||
        getCell(player.x - player.radius*0.8, newY + Math.sign(player.vy)*player.radius) === 1 ||
        getCell(player.x + player.radius*0.8, newY + Math.sign(player.vy)*player.radius) === 1) {
        player.vy = 0;
        hitWall = true;
    } else {
        player.y = newY;
    }

    if (hitWall && time - lastBump > 200) {
        playBumpSound();
        lastBump = time;
    }

    // Check goal
    if (getCell(player.x, player.y) === 2) {
        endGame();
    }
}

function drawScene() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Map Based on Ping Proximity
    for (let r = 0; r < maze.length; r++) {
        for (let c = 0; c < maze[0].length; c++) {
            let type = maze[r][c];
            if (type === 1 || type === 2) {
                let cellCenterX = c * cellSize + cellSize/2;
                let cellCenterY = r * cellSize + cellSize/2;
                
                let maxBrightness = 0;
                for(let p of pings) {
                    let dist = Math.hypot(p.x - cellCenterX, p.y - cellCenterY);
                    let diff = Math.abs(dist - p.radius);
                    if (diff < cellSize * 1.5) {
                        let brightness = (1 - diff / (cellSize * 1.5)) * p.opacity;
                        if (brightness > maxBrightness) maxBrightness = brightness;
                    }
                }

                if (maxBrightness > 0.05) {
                    ctx.fillStyle = type === 1 ? `rgba(0, 150, 255, ${maxBrightness})` : `rgba(255, 215, 0, ${maxBrightness})`;
                    ctx.strokeStyle = type === 1 ? `rgba(0, 255, 255, ${maxBrightness})` : `rgba(255, 255, 255, ${maxBrightness})`;
                    ctx.lineWidth = 2;
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }
            }
        }
    }

    // Draw ping rings
    for(let p of pings) {
        ctx.strokeStyle = `rgba(150, 255, 150, ${p.opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function gameLoop(time) {
    if (gameState !== 'playing') return;
    let dt = (time - lastFrame) / 1000;
    if (dt > 0.1) dt = 0.1; // cap dt
    lastFrame = time;

    timeElapsed = (Date.now() - startTime) / 1000;
    currentTimeEl.innerText = timeElapsed.toFixed(1);

    handlePhysics(dt, time);
    handlePings(dt);
    drawScene();

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState = 'over';
    playWinSound();
    
    let baseTime = parseFloat(timeElapsed.toFixed(2));
    let penalty = 0;
    
    if (freePings !== -1 && pingsUsed > freePings) {
        penalty = (pingsUsed - freePings) * penaltyPerPing;
    }
    
    finalTotalScore = parseFloat((baseTime + penalty).toFixed(2));
    
    document.getElementById('baseTime').innerText = baseTime.toFixed(2);
    document.getElementById('penaltyTime').innerText = penalty.toFixed(2);
    document.getElementById('finalTime').innerText = finalTotalScore.toFixed(2);
    
    saveScoreBtn.disabled = false;
    saveScoreBtn.textContent = 'Save Time';
    gameOverScreen.classList.remove('hidden');
}

// Input handling
window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ') { e.preventDefault(); keys.space = true; } // Prevent scrolling
});
window.addEventListener('keyup', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === ' ') keys.space = false;
});

// Init events
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', () => {
    uiOverlay.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// API Logic
async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/scores');
        const scores = await res.json();
        leaderboardEl.innerHTML = '';
        scores.forEach(s => {
            const li = document.createElement('li');
            li.textContent = `${s.name}: ${s.score.toFixed(2)}s`;
            leaderboardEl.appendChild(li);
        });
    } catch (e) { console.error('Error:', e); }
}

saveScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim() || 'Diver';
    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score: finalTotalScore })
        });
        playerNameInput.value = '';
        await fetchLeaderboard();
        saveScoreBtn.disabled = true;
        saveScoreBtn.textContent = 'Saved!';
    } catch (e) {}
});

fetchLeaderboard();
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

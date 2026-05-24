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
let player = { x: 50, y: 50, vx: 0, vy: 0, radius: 8, invulnTimer: 0 };
let keys = { w: false, a: false, s: false, d: false, space: false };
let pings = [];
let mines = [];
let mineHits = 0;
let startTime = 0;
let timeElapsed = 0;
let lastFrame = performance.now();
let lastBump = 0;

let difficulty = 'easy';
let freePings = -1; // -1 means unlimited
let pingsUsed = 0;
let penaltyPerPing = 3;
let penaltyPerMine = 10;
let finalTotalScore = 0;

// Audio Context
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playPingSound(isMine = false) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (isMine) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.4);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
    }
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
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

function playExplosionSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
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

// Simple Maze (1: wall, 0: open, 2: goal, 3: mine spawn)
const cellSize = 40;
const rawMaze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,3,1,0,0,0,2,1],
    [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,0,1,0,3,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,3,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,3,0,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1],
    [1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,1,0,1,0,1],
    [1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,1,1,1,0,1,1,1,1,1],
    [1,0,0,0,0,3,0,0,1,0,0,3,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
let maze = [];

function initGame() {
    initAudio();
    
    // Parse map and spawn mines
    maze = JSON.parse(JSON.stringify(rawMaze));
    mines = [];
    for (let r = 0; r < maze.length; r++) {
        for (let c = 0; c < maze[0].length; c++) {
            if (maze[r][c] === 3) {
                mines.push({
                    x: c * cellSize + cellSize/2,
                    y: r * cellSize + cellSize/2,
                    radius: 12,
                    timer: Math.random() * 3 + 2 // 2 to 5 seconds
                });
                maze[r][c] = 0; // Clear it so it behaves like open water
            }
        }
    }
    
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
    
    player = { x: 60, y: 60, vx: 0, vy: 0, radius: 8, invulnTimer: 0 };
    pings = [];
    pingsUsed = 0;
    mineHits = 0;
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
        // Player ping logic: cooldown checking based on last ping size
        let canPing = true;
        for (let p of pings) {
            if (p.type === 'player' && p.radius < 100) {
                canPing = false;
                break;
            }
        }
        
        if (canPing) {
            pings.push({ x: player.x, y: player.y, radius: 0, opacity: 1, type: 'player' });
            pingsUsed++;
            updatePingHUD();
            playPingSound(false);
        }
        keys.space = false;
    }
    
    // Mine pings
    for (let m of mines) {
        m.timer -= dt;
        if (m.timer <= 0) {
            pings.push({ x: m.x, y: m.y, radius: 0, opacity: 1, type: 'mine' });
            playPingSound(true);
            m.timer = Math.random() * 2 + 3; // Reset to 3-5 seconds
        }
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
    
    // Mine collisions
    if (player.invulnTimer > 0) {
        player.invulnTimer -= dt;
    } else {
        for (let m of mines) {
            let dist = Math.hypot(player.x - m.x, player.y - m.y);
            if (dist < player.radius + m.radius) {
                // Collision!
                mineHits++;
                playExplosionSound();
                player.invulnTimer = 1.0; // 1 second invulnerability
                
                // Bounce back
                let angle = Math.atan2(player.y - m.y, player.x - m.x);
                player.vx = Math.cos(angle) * 500;
                player.vy = Math.sin(angle) * 500;
                break;
            }
        }
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
    if (player.invulnTimer > 0) {
        // Flash if invulnerable
        ctx.fillStyle = Math.floor(Date.now() / 100) % 2 === 0 ? '#4CAF50' : '#ff0000';
    } else {
        ctx.fillStyle = '#4CAF50';
    }
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
                
                let bNormal = 0;
                let bMine = 0;
                
                for(let p of pings) {
                    let dist = Math.hypot(p.x - cellCenterX, p.y - cellCenterY);
                    let diff = Math.abs(dist - p.radius);
                    if (diff < cellSize * 1.5) {
                        let brightness = (1 - diff / (cellSize * 1.5)) * p.opacity;
                        if (p.type === 'mine') {
                            if (brightness > bMine) bMine = brightness;
                        } else {
                            if (brightness > bNormal) bNormal = brightness;
                        }
                    }
                }

                if (bNormal > 0.05 || bMine > 0.05) {
                    if (type === 1) {
                        // Blend wall colors
                        let red = Math.min(255, bMine * 255);
                        let green = Math.min(255, bNormal * 150);
                        let blue = Math.min(255, bNormal * 255);
                        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${Math.max(bNormal, bMine)})`;
                        
                        let sRed = Math.min(255, bMine * 255);
                        let sGreen = Math.min(255, bNormal * 255);
                        let sBlue = Math.min(255, bNormal * 255);
                        ctx.strokeStyle = `rgba(${sRed}, ${sGreen}, ${sBlue}, ${Math.max(bNormal, bMine)})`;
                    } else if (type === 2) {
                        // Goal always looks golden
                        let b = Math.max(bNormal, bMine);
                        ctx.fillStyle = `rgba(255, 215, 0, ${b})`;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${b})`;
                    }
                    
                    ctx.lineWidth = 2;
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }
            }
        }
    }
    
    // Draw Mines based on ping proximity
    for (let m of mines) {
        let maxBrightness = 0;
        for(let p of pings) {
            let dist = Math.hypot(p.x - m.x, p.y - m.y);
            let diff = Math.abs(dist - p.radius);
            if (diff < cellSize * 1.5) {
                let brightness = (1 - diff / (cellSize * 1.5)) * p.opacity;
                if (brightness > maxBrightness) maxBrightness = brightness;
            }
        }
        
        if (maxBrightness > 0.05) {
            ctx.fillStyle = `rgba(255, 50, 50, ${maxBrightness})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw spikes
            ctx.strokeStyle = `rgba(255, 100, 100, ${maxBrightness})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                let angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(m.x + Math.cos(angle) * m.radius, m.y + Math.sin(angle) * m.radius);
                ctx.lineTo(m.x + Math.cos(angle) * (m.radius + 4), m.y + Math.sin(angle) * (m.radius + 4));
                ctx.stroke();
            }
        }
    }

    // Draw ping rings
    for(let p of pings) {
        if (p.type === 'mine') {
            ctx.strokeStyle = `rgba(255, 50, 50, ${p.opacity * 0.7})`;
        } else {
            ctx.strokeStyle = `rgba(150, 255, 150, ${p.opacity * 0.5})`;
        }
        ctx.lineWidth = p.type === 'mine' ? 3 : 2;
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
    let pPenalty = 0;
    let mPenalty = mineHits * penaltyPerMine;
    
    if (freePings !== -1 && pingsUsed > freePings) {
        pPenalty = (pingsUsed - freePings) * penaltyPerPing;
    }
    
    finalTotalScore = parseFloat((baseTime + pPenalty + mPenalty).toFixed(2));
    
    document.getElementById('baseTime').innerText = baseTime.toFixed(2);
    document.getElementById('penaltyTime').innerText = pPenalty.toFixed(2);
    document.getElementById('minePenaltyTime').innerText = mPenalty.toFixed(2);
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
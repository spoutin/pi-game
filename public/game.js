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
const torpedoCountEl = document.getElementById('torpedoCount');
const difficultyRadios = document.getElementsByName('difficulty');

let gameState = 'start';
let player = { x: 50, y: 50, vx: 0, vy: 0, radius: 10, invulnTimer: 0, angle: 0 };
let keys = { w: false, a: false, s: false, d: false, space: false };
let pings = [];
let wakes = [];
let mines = [];
let torpedoes = [];
let surfaceShips = [];
let depthCharges = [];
let maxHealth = 3;
let currentHealth = 3;
let startTime = 0;
let timeElapsed = 0;
let lastFrame = performance.now();
let lastBump = 0;

let difficulty = 'easy';
let freePings = -1; // -1 means unlimited
let pingsUsed = 0;
let torpedoReloadTime = 10; // seconds
let torpedoTimer = 0;
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

function playTorpedoSound() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

// Simple Maze (1: wall, 0: open, 2: goal, 3: mine spawn)
const cellSize = 40;
const rawMaze = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
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
    
    if (difficulty === 'easy') { freePings = -1; torpedoReloadTime = 10; }
    else if (difficulty === 'medium') { freePings = 25; torpedoReloadTime = 30; }
    else if (difficulty === 'hard') { freePings = 10; torpedoReloadTime = 60; }
    
    player = { x: 60, y: 140, vx: 0, vy: 0, radius: 10, invulnTimer: 0, angle: 0 };
    pings = [];
    wakes = [];
    torpedoes = [];
    surfaceShips = [];
    depthCharges = [];
    pingsUsed = 0;
    torpedoTimer = 0;
    mineHits = 0;
    currentHealth = maxHealth;
    startTime = Date.now();
    gameState = 'playing';
    
    updatePingHUD();
    updateHealthHUD();
    
    uiOverlay.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lastFrame = performance.now();
    requestAnimationFrame(gameLoop);
}

const healthCountEl = document.getElementById('healthCount');

function updateHealthHUD() {
    let hearts = '';
    for (let i = 0; i < maxHealth; i++) {
        hearts += i < currentHealth ? '♥' : '♡';
    }
    healthCountEl.innerText = hearts;
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

    if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
        player.angle = Math.atan2(player.vy, player.vx);
        
        // Add wake behind the sub
        if (Math.random() < 0.4) {
            let backX = player.x - Math.cos(player.angle) * player.radius * 2;
            let backY = player.y - Math.sin(player.angle) * player.radius * 2;
            wakes.push({
                x: backX + (Math.random() - 0.5) * 8,
                y: backY + (Math.random() - 0.5) * 8,
                radius: Math.random() * 3 + 1.5,
                opacity: 0.8,
                life: 1.0
            });
        }
    }
    
    // Update wakes
    for (let i = wakes.length - 1; i >= 0; i--) {
        wakes[i].life -= dt;
        wakes[i].opacity = wakes[i].life * 0.8;
        wakes[i].radius += dt * 2; // bubbles slightly expand
        if (wakes[i].life <= 0) {
            wakes.splice(i, 1);
        }
    }
    
    // Update Torpedoes
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        let t = torpedoes[i];
        t.x += Math.cos(t.angle) * t.speed * dt;
        t.y += Math.sin(t.angle) * t.speed * dt;
        
        // Add torpedo wake
        if (Math.random() < 0.6) {
            wakes.push({
                x: t.x - Math.cos(t.angle) * 5 + (Math.random() - 0.5) * 4,
                y: t.y - Math.sin(t.angle) * 5 + (Math.random() - 0.5) * 4,
                radius: Math.random() * 2 + 1,
                opacity: 0.8,
                life: 0.5
            });
        }
        
        // Torpedo Wall Collision
        if (getCell(t.x, t.y) === 1) {
            torpedoes.splice(i, 1);
            playExplosionSound();
            pings.push({ x: t.x, y: t.y, radius: 0, opacity: 1, type: 'mine' }); // explosion ping
            continue;
        }
        
        // Torpedo Mine Collision
        let hitMine = false;
        for (let j = mines.length - 1; j >= 0; j--) {
            let m = mines[j];
            let dist = Math.hypot(t.x - m.x, t.y - m.y);
            if (dist < m.radius + 5) { // 5 is approx torpedo radius
                // Destroy Mine and Torpedo
                mines.splice(j, 1);
                torpedoes.splice(i, 1);
                hitMine = true;
                playExplosionSound();
                pings.push({ x: t.x, y: t.y, radius: 0, opacity: 1, type: 'mine' }); // big explosion ping
                break;
            }
        }
        if (hitMine) continue;
    }
    
    // Update Surface Ships
    if (Math.random() < 0.01 && surfaceShips.length < 2) {
        // Spawn a new ship
        surfaceShips.push({
            x: Math.random() < 0.5 ? -50 : canvas.width + 50,
            y: 30, // near surface
            vx: 0,
            speed: Math.random() * 50 + 50,
            direction: 0,
            dropTimer: 0
        });
        let ship = surfaceShips[surfaceShips.length - 1];
        ship.direction = ship.x < 0 ? 1 : -1;
        ship.vx = ship.speed * ship.direction;
    }
    
    for (let i = surfaceShips.length - 1; i >= 0; i--) {
        let ship = surfaceShips[i];
        ship.x += ship.vx * dt;
        
        // Drop depth charge if roughly above player
        if (Math.abs(ship.x - player.x) < 50 && ship.dropTimer <= 0) {
            depthCharges.push({
                x: ship.x,
                y: ship.y + 10,
                vy: 80, // falls down
                radius: 6,
                active: true
            });
            ship.dropTimer = 2.0; // cooldown
        }
        if (ship.dropTimer > 0) ship.dropTimer -= dt;
        
        // Remove if off screen
        if ((ship.direction === 1 && ship.x > canvas.width + 100) || 
            (ship.direction === -1 && ship.x < -100)) {
            surfaceShips.splice(i, 1);
        }
    }
    
    // Update Depth Charges
    for (let i = depthCharges.length - 1; i >= 0; i--) {
        let dc = depthCharges[i];
        dc.y += dc.vy * dt;
        
        // Hit map floor only
        if (dc.y > canvas.height) {
            playExplosionSound();
            pings.push({ x: dc.x, y: dc.y, radius: 0, opacity: 1, type: 'mine' }); // explosion ping
            depthCharges.splice(i, 1);
            continue;
        }
        
        // Hit player
        if (player.invulnTimer <= 0) {
            let dist = Math.hypot(player.x - dc.x, player.y - dc.y);
            if (dist < player.radius + dc.radius) {
                currentHealth--;
                updateHealthHUD();
                playExplosionSound();
                player.invulnTimer = 1.0;
                
                // Bounce back
                let angle = Math.atan2(player.y - dc.y, player.x - dc.x);
                player.vx = Math.cos(angle) * 500;
                player.vy = Math.sin(angle) * 500;
                
                pings.push({ x: dc.x, y: dc.y, radius: 0, opacity: 1, type: 'mine' });
                depthCharges.splice(i, 1);
                
                if (currentHealth <= 0) {
                    endGame(false);
                }
                continue;
            }
        }
    }

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
                currentHealth--;
                updateHealthHUD();
                playExplosionSound();
                player.invulnTimer = 1.0; // 1 second invulnerability
                
                // Bounce back
                let angle = Math.atan2(player.y - m.y, player.x - m.x);
                player.vx = Math.cos(angle) * 500;
                player.vy = Math.sin(angle) * 500;
                
                if (currentHealth <= 0) {
                    endGame(false);
                }
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

    // Draw Surface Water (Gradient)
    let gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, 'rgba(0, 50, 100, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 50, 100, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 100);
    
    // Wavy Surface Line
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 10) {
        let y = 30 + Math.sin(x * 0.05 + Date.now() * 0.002) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw wakes
    for (let w of wakes) {
        ctx.fillStyle = `rgba(180, 240, 255, ${w.opacity})`;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Surface Ships
    for (let s of surfaceShips) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        // Ship hull
        ctx.moveTo(s.x - 30 * s.direction, s.y);
        ctx.lineTo(s.x + 20 * s.direction, s.y);
        ctx.lineTo(s.x + 30 * s.direction, s.y - 15);
        ctx.lineTo(s.x - 20 * s.direction, s.y - 15);
        ctx.fill();
        // Ship cabin
        ctx.fillStyle = '#666';
        ctx.fillRect(s.x - 10, s.y - 25, 20, 10);
    }
    
    // Draw Depth Charges
    for (let dc of depthCharges) {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(dc.x, dc.y, dc.radius, 0, Math.PI * 2);
        ctx.fill();
        // Little light on it
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(dc.x, dc.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Torpedoes
    for (let t of torpedoes) {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#555';
        ctx.fillRect(-8, -4, 4, 8); // tail
        
        ctx.restore();
    }

    // Draw player (submarine)
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // We want the sub to point in the direction of movement, 
    // but we don't want it to be upside down when moving left.
    // If moving left (angle between PI/2 and 3PI/2 or -PI/2 and -3PI/2), we flip it vertically.
    let isMovingLeft = Math.abs(player.angle) > Math.PI / 2;
    if (isMovingLeft) {
        ctx.scale(-1, 1);
        ctx.rotate(Math.PI - player.angle);
    } else {
        ctx.rotate(player.angle);
    }
    
    let subColor = '#4CAF50';
    let subDark = '#2e7d32';
    let subHighlight = '#81c784';
    
    if (player.invulnTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        subColor = '#ff5555';
        subDark = '#cc0000';
        subHighlight = '#ff8888';
    }
    
    // Submarine shadow / shading
    ctx.fillStyle = subDark;
    ctx.beginPath();
    ctx.ellipse(0, 2, player.radius * 2, player.radius * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Submarine main hull
    ctx.fillStyle = subColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, player.radius * 2, player.radius * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Hull highlight (gives a 3D rounded look)
    ctx.fillStyle = subHighlight;
    ctx.beginPath();
    ctx.ellipse(0, -3, player.radius * 1.5, player.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Conning tower (sail)
    ctx.fillStyle = subDark;
    ctx.fillRect(-player.radius * 0.4, -player.radius * 2, player.radius * 1.2, player.radius * 1.2);
    ctx.fillStyle = subColor;
    ctx.fillRect(-player.radius * 0.4, -player.radius * 2.2, player.radius * 1.2, player.radius * 0.4);
    
    // Window on sail with glass reflection
    ctx.fillStyle = '#01579b'; // dark blue rim
    ctx.beginPath();
    ctx.arc(player.radius * 0.2, -player.radius * 1.5, player.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#81d4fa'; // light blue window
    ctx.beginPath();
    ctx.arc(player.radius * 0.2, -player.radius * 1.5, player.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // glare
    ctx.beginPath();
    ctx.arc(player.radius * 0.1, -player.radius * 1.6, player.radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail fin (top and bottom)
    ctx.fillStyle = subDark;
    ctx.beginPath();
    ctx.moveTo(-player.radius * 1.5, 0);
    ctx.lineTo(-player.radius * 2.8, -player.radius * 1.5);
    ctx.lineTo(-player.radius * 2.2, 0);
    ctx.lineTo(-player.radius * 2.8, player.radius * 1.5);
    ctx.fill();
    
    // Propeller housing
    ctx.fillStyle = '#424242';
    ctx.fillRect(-player.radius * 3.0, -player.radius * 0.4, player.radius * 0.8, player.radius * 0.8);
    
    // Propeller spinning effect
    ctx.fillStyle = '#bdbdbd'; // light grey
    let propScale = Math.abs(Math.sin(Date.now() / 30));
    ctx.fillRect(-player.radius * 3.2, -player.radius * 1.2 * propScale, player.radius * 0.4, player.radius * 2.4 * propScale);
    
    ctx.restore();

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
                        
                        ctx.lineWidth = 2;
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    } else if (type === 2) {
                        // Treasure Chest
                        let b = Math.max(bNormal, bMine);
                        
                        // Chest base
                        ctx.fillStyle = `rgba(139, 69, 19, ${b})`; // SaddleBrown
                        ctx.fillRect(c * cellSize + 5, r * cellSize + 15, cellSize - 10, cellSize - 20);
                        
                        // Chest lid
                        ctx.beginPath();
                        ctx.arc(c * cellSize + cellSize / 2, r * cellSize + 15, (cellSize - 10) / 2, Math.PI, 0);
                        ctx.fill();
                        
                        // Gold trims
                        ctx.strokeStyle = `rgba(255, 215, 0, ${b})`;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(c * cellSize + 5, r * cellSize + 15, cellSize - 10, cellSize - 20);
                        ctx.beginPath();
                        ctx.arc(c * cellSize + cellSize / 2, r * cellSize + 15, (cellSize - 10) / 2, Math.PI, 0);
                        ctx.stroke();
                        
                        // Lock
                        ctx.fillStyle = `rgba(218, 165, 32, ${b})`; // GoldenRod
                        ctx.fillRect(c * cellSize + cellSize / 2 - 3, r * cellSize + 12, 6, 8);
                    }
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

const torpedoUICanvas = document.getElementById('torpedoUICanvas');
const torpedoUICtx = torpedoUICanvas ? torpedoUICanvas.getContext('2d') : null;

function drawTorpedoUI() {
    if (!torpedoUICtx) return;
    
    torpedoUICtx.clearRect(0, 0, torpedoUICanvas.width, torpedoUICanvas.height);
    
    // Draw outline
    torpedoUICtx.strokeStyle = torpedoTimer <= 0 ? '#4CAF50' : '#ff3333';
    torpedoUICtx.lineWidth = 1;
    torpedoUICtx.beginPath();
    torpedoUICtx.ellipse(20, 7.5, 15, 5, 0, 0, Math.PI * 2);
    torpedoUICtx.stroke();
    torpedoUICtx.fillStyle = '#555';
    torpedoUICtx.fillRect(1, 4.5, 6, 6);
    
    // Draw fill based on reload progress
    if (torpedoTimer <= 0) {
        torpedoUICtx.fillStyle = '#4CAF50';
        torpedoUICtx.beginPath();
        torpedoUICtx.ellipse(20, 7.5, 15, 5, 0, 0, Math.PI * 2);
        torpedoUICtx.fill();
    } else {
        let progress = 1.0 - (torpedoTimer / torpedoReloadTime);
        torpedoUICtx.fillStyle = '#ff3333';
        
        torpedoUICtx.save();
        torpedoUICtx.beginPath();
        torpedoUICtx.rect(5, 0, 30 * progress, 15);
        torpedoUICtx.clip();
        
        torpedoUICtx.beginPath();
        torpedoUICtx.ellipse(20, 7.5, 15, 5, 0, 0, Math.PI * 2);
        torpedoUICtx.fill();
        torpedoUICtx.restore();
    }
}

function gameLoop(time) {
    if (gameState !== 'playing') return;
    let dt = (time - lastFrame) / 1000;
    if (dt > 0.1) dt = 0.1; // cap dt
    lastFrame = time;

    timeElapsed = (Date.now() - startTime) / 1000;
    currentTimeEl.innerText = timeElapsed.toFixed(1);
    
    if (torpedoTimer > 0) {
        torpedoTimer -= dt;
        if (torpedoTimer < 0) torpedoTimer = 0;
    }
    drawTorpedoUI();

    handlePhysics(dt, time);
    handlePings(dt);
    drawScene();

    requestAnimationFrame(gameLoop);
}

function endGame(win = true) {
    gameState = 'over';
    
    const statsBox = document.getElementById('statsBox');
    const titleEl = document.getElementById('endGameTitle');
    
    if (win) {
        playWinSound();
        titleEl.innerText = 'Escaped!';
        titleEl.className = 'game-win-title';
        statsBox.classList.remove('hidden');
        saveScoreBtn.classList.remove('hidden');
        playerNameInput.classList.remove('hidden');
        
        let baseTime = parseFloat(timeElapsed.toFixed(2));
        let pPenalty = 0;
        
        if (freePings !== -1 && pingsUsed > freePings) {
            pPenalty = (pingsUsed - freePings) * penaltyPerPing;
        }
        
        finalTotalScore = parseFloat((baseTime + pPenalty).toFixed(2));
        
        document.getElementById('baseTime').innerText = baseTime.toFixed(2);
        document.getElementById('penaltyTime').innerText = pPenalty.toFixed(2);
        document.getElementById('finalTime').innerText = finalTotalScore.toFixed(2);
    } else {
        playExplosionSound();
        titleEl.innerText = 'Destroyed!';
        titleEl.className = 'game-over-title';
        statsBox.classList.add('hidden');
        saveScoreBtn.classList.add('hidden');
        playerNameInput.classList.add('hidden');
    }
    
    saveScoreBtn.disabled = false;
    saveScoreBtn.textContent = 'Save Time';
    gameOverScreen.classList.remove('hidden');
}

// Input handling
let isMouseDown = false;

// Mobile Controls Setup
const mobileControls = document.getElementById('mobile-controls');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnPing = document.getElementById('btn-ping');
const btnFire = document.getElementById('btn-fire');

// Helper for mobile buttons
function setupMobileBtn(btn, key) {
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[key] = true;
    });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[key] = false;
    });
    btn.addEventListener('mousedown', (e) => {
        keys[key] = true;
    });
    btn.addEventListener('mouseup', (e) => {
        keys[key] = false;
    });
    btn.addEventListener('mouseleave', (e) => {
        keys[key] = false;
    });
}

setupMobileBtn(btnUp, 'w');
setupMobileBtn(btnDown, 's');
setupMobileBtn(btnLeft, 'a');
setupMobileBtn(btnRight, 'd');

if (btnPing) {
    btnPing.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.space = true;
    });
    btnPing.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.space = false;
    });
    btnPing.addEventListener('mousedown', () => keys.space = true);
    btnPing.addEventListener('mouseup', () => keys.space = false);
}

if (btnFire) {
    btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        fireTorpedo();
    });
    btnFire.addEventListener('mousedown', fireTorpedo);
}

// Show mobile controls if touch device is detected
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    mobileControls.classList.remove('hidden');
}

window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ') { e.preventDefault(); keys.space = true; } // Prevent scrolling
    
    // Fire Torpedo
    if (e.key === 'Shift') fireTorpedo();
});

window.addEventListener('mousedown', e => {
    if (e.target === canvas) fireTorpedo();
});

function fireTorpedo() {
    if (gameState !== 'playing') return;
    if (torpedoTimer <= 0) {
        torpedoes.push({
            x: player.x + Math.cos(player.angle) * player.radius * 2,
            y: player.y + Math.sin(player.angle) * player.radius * 2,
            angle: player.angle,
            speed: 300
        });
        torpedoTimer = torpedoReloadTime;
        playTorpedoSound();
    }
}

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
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameArea = document.querySelector('.game-area');
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

const healthCountEl = document.getElementById('healthCount');
const missionOverlay = document.getElementById('missionOverlay');
const missionText = document.getElementById('missionText');
const missionContinue = document.getElementById('missionContinue');
const statsBox = document.getElementById('statsBox');
const endGameTitle = document.getElementById('endGameTitle');
const baseTimeEl = document.getElementById('baseTime');
const penaltyTimeEl = document.getElementById('penaltyTime');
const finalTimeEl = document.getElementById('finalTime');

// Audio Settings UI Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const musicToggle = document.getElementById('musicToggle');
const sfxToggle = document.getElementById('sfxToggle');
const musicVolumeSlider = document.getElementById('musicVolume');
const sfxVolumeSlider = document.getElementById('sfxVolume');

// Game State
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
let cameraX = 0;
let cameraY = 0;

let difficulty = 'easy';
let freePings = -1;
let pingsUsed = 0;
let torpedoReloadTime = 10;
let torpedoTimer = 0;
let penaltyPerPing = 3;
let penaltyPerMine = 10;
let mineHits = 0;
let finalTotalScore = 0;

// Maze dimensions
let cellSize = 50;
const worldCols = 60;
const worldRows = 60;
let maze = [];

// Audio State
let audioCtx;
let musicNodes = [];
let engineOsc;
let engineGain;
let musicTimer;
let audioSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.5
};

function loadSettings() {
    const saved = localStorage.getItem('sonar_escape_settings');
    if (saved) {
        audioSettings = { ...audioSettings, ...JSON.parse(saved) };
    }
    if (musicToggle) musicToggle.checked = audioSettings.musicEnabled;
    if (sfxToggle) sfxToggle.checked = audioSettings.sfxEnabled;
    if (musicVolumeSlider) musicVolumeSlider.value = audioSettings.musicVolume;
    if (sfxVolumeSlider) sfxVolumeSlider.value = audioSettings.sfxVolume;
}

function saveSettings() {
    localStorage.setItem('sonar_escape_settings', JSON.stringify(audioSettings));
    updateAudioVolumes();
}

function updateAudioVolumes() {
    if (!audioCtx) return;
    musicNodes.forEach(node => {
        const targetGain = audioSettings.musicEnabled ? (node.baseGain * audioSettings.musicVolume) : 0;
        node.gain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
    });
    if (engineGain) {
        const targetGain = audioSettings.sfxEnabled ? (0.05 * audioSettings.sfxVolume) : 0;
        engineGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
    }
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function startBackgroundAudio() {
    if (!audioCtx) return;
    if (musicNodes.length > 0) return;
    
    // Ambient noise drones removed per user request in Issue #1
    
    // Setup Engine Sound
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'triangle';
    engineOsc.frequency.value = 45;
    engineGain.gain.value = 0;
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
    // Start with 0 volume at rest
    engineGain.gain.setValueAtTime(0, audioCtx.currentTime);

    // Minimal Composed Theme (Slow, haunting sequence)
    const melodyScale = [130.81, 146.83, 155.56, 174.61, 196.00]; // C, D, Eb, F, G
    let step = 0;
    const tempo = 1.2; // Slightly slower, more atmospheric
    
    const playNextNote = () => {
        if (gameState !== 'playing') return;
        if (audioSettings.musicEnabled) {
            const now = audioCtx.currentTime;
            
            // Bass pulse every 2 beats
            if (step % 2 === 0) {
                let bassOsc = audioCtx.createOscillator();
                let bassGain = audioCtx.createGain();
                bassOsc.type = 'sine';
                bassOsc.frequency.setValueAtTime(step % 8 === 0 ? 55 : 41.20, now); // A1 or E1
                bassGain.gain.setValueAtTime(0, now);
                bassGain.gain.linearRampToValueAtTime(0.08 * audioSettings.musicVolume, now + 0.5);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
                bassOsc.connect(bassGain);
                bassGain.connect(audioCtx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + 2);
            }

            // Melody follows a 16-step phrase
            if (step % 4 === 0) {
                let osc = audioCtx.createOscillator();
                let gain = audioCtx.createGain();
                let filter = audioCtx.createBiquadFilter();
                
                // Deterministic melody within the 16-step phrase
                const phraseIndex = (step / 4) % 4;
                const phraseNotes = [0, 2, 4, 3]; // Scale indices
                let freq = melodyScale[phraseNotes[phraseIndex]];
                
                if ((step / 16) % 2 === 1) freq *= 1.5; // Variation every 16 steps
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                
                filter.type = 'lowpass';
                filter.frequency.value = 600;
                
                const noteGain = 0.05 * audioSettings.musicVolume;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(noteGain, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(now);
                osc.stop(now + 3);
            }
        }
        step++;
        musicTimer = setTimeout(playNextNote, (tempo / 2) * 1000);
    };
    playNextNote();
}

function stopBackgroundAudio() {
    musicNodes.forEach(node => {
        node.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 1);
        setTimeout(() => { try { node.osc.stop(); } catch(e) {} }, 2000);
    });
    musicNodes = [];
    if (engineOsc) {
        engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
        setTimeout(() => { if (engineOsc) { try { engineOsc.stop(); } catch(e) {} engineOsc = null; } }, 1000);
    }
    if (musicTimer) clearTimeout(musicTimer);
}

function playPingSound(isMine = false) {
    if (!audioCtx || !audioSettings.sfxEnabled) return;
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
    const baseGain = 0.3 * audioSettings.sfxVolume;
    gain.gain.setValueAtTime(baseGain, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
}

function playBumpSound() {
    if (!audioCtx || !audioSettings.sfxEnabled) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    const baseGain = 0.2 * audioSettings.sfxVolume;
    gain.gain.setValueAtTime(baseGain, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playExplosionSound() {
    if (!audioCtx || !audioSettings.sfxEnabled) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
    const baseGain = 0.5 * audioSettings.sfxVolume;
    gain.gain.setValueAtTime(baseGain, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playWinSound() {
    if (!audioCtx || !audioSettings.sfxEnabled) return;
    const freqs = [440, 554, 659, 880];
    freqs.forEach((f, i) => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = f;
        const noteGain = 0.3 * audioSettings.sfxVolume;
        gain.gain.setValueAtTime(0, audioCtx.currentTime + i*0.1);
        gain.gain.linearRampToValueAtTime(noteGain, audioCtx.currentTime + i*0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i*0.1 + 0.5);
        osc.start(audioCtx.currentTime + i*0.1);
        osc.stop(audioCtx.currentTime + i*0.1 + 0.5);
    });
}

function playTorpedoSound() {
    if (!audioCtx || !audioSettings.sfxEnabled) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.8);
    const baseGain = 0.4 * audioSettings.sfxVolume;
    gain.gain.setValueAtTime(baseGain, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

function playTypewriterSound() {
    if (!audioCtx || !audioSettings.sfxEnabled) return;
    const now = audioCtx.currentTime;
    
    // 1. Sharp high-frequency click (the metal arm hitting the paper)
    let clickOsc = audioCtx.createOscillator();
    let clickGain = audioCtx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.01);
    clickGain.gain.setValueAtTime(0.1 * audioSettings.sfxVolume, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    clickOsc.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    
    // 2. Mid-frequency "thwack" (the mechanical action)
    let thwackOsc = audioCtx.createOscillator();
    let thwackGain = audioCtx.createGain();
    thwackOsc.type = 'triangle';
    thwackOsc.frequency.setValueAtTime(200, now);
    thwackOsc.frequency.exponentialRampToValueAtTime(50, now + 0.03);
    thwackGain.gain.setValueAtTime(0.15 * audioSettings.sfxVolume, now);
    thwackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    thwackOsc.connect(thwackGain);
    thwackGain.connect(audioCtx.destination);

    // 3. Low-frequency "thud" (the weight of the machine)
    let thudOsc = audioCtx.createOscillator();
    let thudGain = audioCtx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(80, now);
    thudGain.gain.setValueAtTime(0.05 * audioSettings.sfxVolume, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    thudOsc.connect(thudGain);
    thudGain.connect(audioCtx.destination);
    
    clickOsc.start(now);
    clickOsc.stop(now + 0.01);
    thwackOsc.start(now);
    thwackOsc.stop(now + 0.03);
    thudOsc.start(now);
    thudOsc.stop(now + 0.05);
}

function getCell(x, y) {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row >= 0 && row < maze.length && col >= 0 && col < maze[0].length) {
        return maze[row][col];
    }
    return 1;
}

function handlePings(dt) {
    if (keys.space && gameState === 'playing') {
        const now = Date.now();
        if (!player.lastPing || now - player.lastPing > 500) {
            pings.push({ x: player.x, y: player.y, radius: 0, opacity: 1, type: 'sonar' });
            pingsUsed++;
            updatePingHUD();
            playPingSound();
            player.lastPing = now;
        }
    }
    for (let i = pings.length - 1; i >= 0; i--) {
        let p = pings[i];
        p.radius += (p.type === 'mine' ? cellSize * 12 : cellSize * 8) * dt;
        p.opacity -= dt * 0.6;
        if (p.opacity <= 0) pings.splice(i, 1);
    }
}

function updatePingHUD() {
    if (!pingCountEl) return;
    if (freePings === -1) {
        pingCountEl.innerText = 'Unlimited';
    } else {
        const remaining = freePings - pingsUsed;
        if (remaining >= 0) {
            pingCountEl.innerText = remaining;
            pingCountEl.style.color = '#4CAF50';
        } else {
            pingCountEl.innerText = `+${Math.abs(remaining)}`;
            pingCountEl.style.color = '#ff3333';
        }
    }
}

function updateHealthHUD() {
    if (!healthCountEl) return;
    let hearts = '';
    for (let i = 0; i < maxHealth; i++) {
        hearts += i < currentHealth ? '♥' : '♡';
    }
    healthCountEl.innerText = hearts;
}

// UI & Layout
async function requestFullscreen() {
    if (!document.fullscreenElement) {
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.log("Fullscreen not supported or blocked.");
        }
    }
}

async function lockOrientation() {
    if (screen.orientation && screen.orientation.lock) {
        try {
            await screen.orientation.lock('landscape');
        } catch (e) {
            console.log("Orientation lock not supported or requires full-screen.");
        }
    }
}

function resizeCanvas() {
    if (!gameArea) return;

    // Use clientWidth/Height to match the content area (excluding borders)
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;

    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallLandscape = isMobile && isLandscape && window.innerHeight <= 500;
    joystickMaxDist = isSmallLandscape ? 25 : 40;
}

function toggleMobileControls(show) {
    if (!mobileControls) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) { if (show) mobileControls.classList.remove('hidden'); else mobileControls.classList.add('hidden'); }
}

async function showMissionBriefing() {
    const fullText = "MISSION BRIEFING:\n\nDetecting high-value treasure at the end of this sector.\n\nNAVCOM: Use your active SONAR (SPACE) to illuminate the terrain. The abyss is deep and visibility is zero.\n\nCAUTION: Waters are heavily mined. Deploy TORPEDOES (SHIFT/CLICK) to neutralize threats.\n\nGood luck, Commander.";
    missionOverlay.classList.remove('hidden', 'fade-out'); missionContinue.classList.add('hidden'); missionText.textContent = "";
    for (let i = 0; i < fullText.length; i++) {
        missionText.textContent += fullText[i];
        if (fullText[i] !== " " && fullText[i] !== "\n") playTypewriterSound();
        if (fullText[i] === "\n") await new Promise(r => setTimeout(r, 200));
        else await new Promise(r => setTimeout(r, 25));
    }
    missionContinue.classList.remove('hidden');
    await new Promise(resolve => {
        const handler = (e) => { e.preventDefault(); missionOverlay.removeEventListener('click', handler); missionOverlay.removeEventListener('touchstart', handler); resolve(); };
        missionOverlay.addEventListener('click', handler); missionOverlay.addEventListener('touchstart', handler, { passive: false });
    });
    missionOverlay.classList.add('fade-out'); await new Promise(r => setTimeout(r, 1000)); missionOverlay.classList.add('hidden');
}

function generateMaze(cols, rows) {
    let newMaze = Array.from({ length: rows }, () => Array(cols).fill(1));
    for (let r = 0; r < 2; r++) { for (let c = 0; c < cols; c++) newMaze[r][c] = 0; }
    const startR = 3; const startC = 1;
    const stack = [[startR, startC]];
    newMaze[startR][startC] = 0;
    while (stack.length > 0) {
        const [r, c] = stack[stack.length - 1];
        const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
        let moved = false;
        for (const [dr, dc] of dirs) {
            const nr = r + dr; const nc = c + dc;
            if (nr >= startR && nr < rows - 1 && nc > 0 && nc < cols - 1 && newMaze[nr][nc] === 1) {
                newMaze[r + dr / 2][c + dc / 2] = 0;
                newMaze[nr][nc] = 0;
                stack.push([nr, nc]);
                moved = true;
                break;
            }
        }
        if (!moved) stack.pop();
    }
    let placedTreasure = false;
    for (let r = rows - 2; r >= startR; r--) {
        for (let c = cols - 2; c >= 1; c--) { if (newMaze[r][c] === 0) { newMaze[r][c] = 2; placedTreasure = true; break; } }
        if (placedTreasure) break;
    }
    for (let r = startR; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) { if (newMaze[r][c] === 0 && Math.random() < 0.08) newMaze[r][c] = 3; }
    }
    newMaze[3][1] = 0; newMaze[3][2] = 0; newMaze[4][1] = 0;
    return newMaze;
}

// Game Loop Functions
async function initGame() {
    initAudio(); 
    startBackgroundAudio(); 
    
    // Best practice for mobile: Request fullscreen and lock orientation on user gesture
    await requestFullscreen();
    await lockOrientation();
    
    resizeCanvas();
    for (const radio of difficultyRadios) { if (radio.checked) { difficulty = radio.value; break; } }
    if (difficulty === 'easy') { freePings = -1; torpedoReloadTime = 10; }
    else if (difficulty === 'medium') { freePings = 25; torpedoReloadTime = 30; }
    else if (difficulty === 'hard') { freePings = 10; torpedoReloadTime = 60; }
    uiOverlay.classList.add('hidden'); gameOverScreen.classList.add('hidden');
    await showMissionBriefing();
    maze = generateMaze(worldCols, worldRows);
    mines = [];
    for (let r = 0; r < maze.length; r++) {
        for (let c = 0; c < maze[0].length; c++) {
            if (maze[r][c] === 3) { mines.push({ x: c * cellSize + cellSize/2, y: r * cellSize + cellSize/2, radius: cellSize * 0.3, timer: Math.random() * 3 + 2 }); maze[r][c] = 0; }
        }
    }
    player = { x: cellSize * 1.5, y: cellSize * 3.5, vx: 0, vy: 0, radius: cellSize * 0.25, invulnTimer: 0, angle: 0 };
    pings = []; wakes = []; torpedoes = []; surfaceShips = []; depthCharges = [];
    pingsUsed = 0; torpedoTimer = 0; mineHits = 0; currentHealth = maxHealth; startTime = Date.now(); gameState = 'playing';
    updatePingHUD(); updateHealthHUD();
    toggleMobileControls(true); lastFrame = performance.now(); requestAnimationFrame(gameLoop);
}

function handlePhysics(dt, time) {
    const accel = cellSize * 20; const friction = 0.85; let hitWall = false;
    if (keys.w) player.vy -= accel * dt; if (keys.s) player.vy += accel * dt;
    if (keys.a) player.vx -= accel * dt; if (keys.d) player.vx += accel * dt;
    player.vx *= friction; player.vy *= friction;
    if (engineOsc && engineGain) {
        const speed = Math.hypot(player.vx, player.vy); 
        const normalizedSpeed = Math.min(1, speed / (cellSize * 3)); // More sensitive to speed
        engineOsc.frequency.setTargetAtTime(40 + normalizedSpeed * 30, audioCtx.currentTime, 0.1);
        const engineTargetGain = audioSettings.sfxEnabled ? (normalizedSpeed * 0.15 * audioSettings.sfxVolume) : 0;
        engineGain.gain.setTargetAtTime(engineTargetGain, audioCtx.currentTime, 0.1);
    }
    if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
        player.angle = Math.atan2(player.vy, player.vx);
        if (Math.random() < 0.4) {
            let backX = player.x - Math.cos(player.angle) * player.radius * 2; let backY = player.y - Math.sin(player.angle) * player.radius * 2;
            wakes.push({ x: backX + (Math.random() - 0.5) * (cellSize * 0.2), y: backY + (Math.random() - 0.5) * (cellSize * 0.2), radius: Math.random() * (cellSize * 0.08) + (cellSize * 0.04), opacity: 0.8, life: 1.0 });
        }
    }
    for (let i = wakes.length - 1; i >= 0; i--) { wakes[i].life -= dt; wakes[i].opacity = wakes[i].life * 0.8; wakes[i].radius += dt * (cellSize * 0.05); if (wakes[i].life <= 0) wakes.splice(i, 1); }
    for (let i = torpedoes.length - 1; i >= 0; i--) {
        let t = torpedoes[i]; t.x += Math.cos(t.angle) * t.speed * dt; t.y += Math.sin(t.angle) * t.speed * dt;
        if (Math.random() < 0.6) wakes.push({ x: t.x - Math.cos(t.angle) * (cellSize * 0.12) + (Math.random() - 0.5) * (cellSize * 0.1), y: t.y - Math.sin(t.angle) * (cellSize * 0.12) + (Math.random() - 0.5) * (cellSize * 0.1), radius: Math.random() * (cellSize * 0.05) + (cellSize * 0.025), opacity: 0.8, life: 0.5 });
        if (getCell(t.x, t.y) === 1) { torpedoes.splice(i, 1); playExplosionSound(); pings.push({ x: t.x, y: t.y, radius: 0, opacity: 1, type: 'mine' }); continue; }
        let hitMine = false;
        for (let j = mines.length - 1; j >= 0; j--) {
            let m = mines[j]; if (Math.hypot(t.x - m.x, t.y - m.y) < m.radius + cellSize * 0.12) { mines.splice(j, 1); torpedoes.splice(i, 1); hitMine = true; playExplosionSound(); pings.push({ x: t.x, y: t.y, radius: 0, opacity: 1, type: 'mine' }); break; }
        }
        if (hitMine) continue;
    }
    if (Math.random() < 0.01 && surfaceShips.length < 2) {
        const spawnMargin = cellSize * 2;
        const spawnX = Math.random() < 0.5 ? cameraX - spawnMargin : cameraX + canvas.width + spawnMargin;
        surfaceShips.push({ x: spawnX, y: cellSize * 0.75, vx: 0, speed: Math.random() * (cellSize * 1.25) + (cellSize * 1.25), direction: 0, dropTimer: 0 });
        let ship = surfaceShips[surfaceShips.length - 1]; ship.direction = ship.x < cameraX ? 1 : -1; ship.vx = ship.speed * ship.direction;
    }
    for (let i = surfaceShips.length - 1; i >= 0; i--) {
        let ship = surfaceShips[i]; ship.x += ship.vx * dt;
        if (Math.abs(ship.x - player.x) < cellSize * 1.25 && ship.dropTimer <= 0) { depthCharges.push({ x: ship.x, y: ship.y + cellSize * 0.25, vy: cellSize * 2.0, radius: cellSize * 0.15, active: true }); ship.dropTimer = 2.0; }
        if (ship.dropTimer > 0) ship.dropTimer -= dt;
        if ((ship.direction === 1 && ship.x > cameraX + canvas.width + cellSize * 3) || (ship.direction === -1 && ship.x < cameraX - cellSize * 3)) surfaceShips.splice(i, 1);
    }
    for (let i = depthCharges.length - 1; i >= 0; i--) {
        let dc = depthCharges[i]; dc.y += dc.vy * dt;
        if (dc.y > worldRows * cellSize) { playExplosionSound(); pings.push({ x: dc.x, y: dc.y, radius: 0, opacity: 1, type: 'mine' }); depthCharges.splice(i, 1); continue; }
        if (player.invulnTimer <= 0 && Math.hypot(player.x - dc.x, player.y - dc.y) < player.radius + dc.radius) {
            currentHealth--; updateHealthHUD(); playExplosionSound(); player.invulnTimer = 1.0;
            let angle = Math.atan2(player.y - dc.y, player.x - dc.x); player.vx = Math.cos(angle) * (cellSize * 12.5); player.vy = Math.sin(angle) * (cellSize * 12.5);
            pings.push({ x: dc.x, y: dc.y, radius: 0, opacity: 1, type: 'mine' }); depthCharges.splice(i, 1);
            if (currentHealth <= 0) endGame(false); continue;
        }
    }
    let newX = player.x + player.vx * dt; let newY = player.y + player.vy * dt;
    if (getCell(newX + Math.sign(player.vx)*player.radius, player.y) === 1 || getCell(newX + Math.sign(player.vx)*player.radius, player.y - player.radius*0.8) === 1 || getCell(newX + Math.sign(player.vx)*player.radius, player.y + player.radius*0.8) === 1) { player.vx = 0; hitWall = true; } else player.x = newX;
    if (getCell(player.x, newY + Math.sign(player.vy)*player.radius) === 1 || getCell(player.x - player.radius*0.8, newY + Math.sign(player.vy)*player.radius) === 1 || getCell(player.x + player.radius*0.8, newY + Math.sign(player.vy)*player.radius) === 1) { player.vy = 0; hitWall = true; } else player.y = newY;
    if (hitWall && time - lastBump > 200) { playBumpSound(); lastBump = time; }
    if (player.invulnTimer > 0) player.invulnTimer -= dt;
    else {
        for (let m of mines) {
            if (Math.hypot(player.x - m.x, player.y - m.y) < player.radius + m.radius) {
                mineHits++; currentHealth--; updateHealthHUD(); playExplosionSound(); player.invulnTimer = 1.0;
                let angle = Math.atan2(player.y - m.y, player.x - m.x); player.vx = Math.cos(angle) * (cellSize * 12.5); player.vy = Math.sin(angle) * (cellSize * 12.5);
                if (currentHealth <= 0) endGame(false); break;
            }
        }
    }
    if (getCell(player.x, player.y) === 2) endGame();
}

function drawScene() {
    cameraX = player.x - canvas.width / 2;
    cameraY = player.y - canvas.height / 2;
    cameraX = Math.max(0, Math.min(cameraX, worldCols * cellSize - canvas.width));
    cameraY = Math.max(0, Math.min(cameraY, worldRows * cellSize - canvas.height));

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    const surfaceDepth = cellSize * 2.5;
    let gradient = ctx.createLinearGradient(0, 0, 0, surfaceDepth);
    gradient.addColorStop(0, 'rgba(0, 50, 100, 0.4)'); gradient.addColorStop(1, 'rgba(0, 50, 100, 0)');
    ctx.fillStyle = gradient; ctx.fillRect(cameraX, 0, canvas.width, surfaceDepth);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = cameraX; x <= cameraX + canvas.width; x += 10) { let y = (cellSize * 0.75) + Math.sin(x * 0.05 + Date.now() * 0.002) * 5; if (x === cameraX) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    for (let w of wakes) { ctx.fillStyle = `rgba(180, 240, 255, ${w.opacity})`; ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2); ctx.fill(); }
    for (let s of surfaceShips) {
        ctx.fillStyle = '#888'; ctx.beginPath();
        const sw = cellSize * 0.75; const sh = cellSize * 0.375;
        ctx.moveTo(s.x - sw * s.direction, s.y); ctx.lineTo(s.x + sw * 0.66 * s.direction, s.y); ctx.lineTo(s.x + sw * s.direction, s.y - sh); ctx.lineTo(s.x - sw * 0.66 * s.direction, s.y - sh); ctx.fill();
        ctx.fillStyle = '#666'; ctx.fillRect(s.x - cellSize * 0.25, s.y - cellSize * 0.625, cellSize * 0.5, cellSize * 0.25);
    }
    for (let dc of depthCharges) { ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(dc.x, dc.y, dc.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(dc.x, dc.y - dc.radius * 0.3, dc.radius * 0.3, 0, Math.PI * 2); ctx.fill(); }
    for (let t of torpedoes) {
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.angle); ctx.fillStyle = '#ff3333'; ctx.beginPath(); ctx.ellipse(0, 0, cellSize * 0.2, cellSize * 0.075, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#555'; ctx.fillRect(-cellSize * 0.2, -cellSize * 0.1, cellSize * 0.1, cellSize * 0.2); ctx.restore();
    }
    ctx.save(); ctx.translate(player.x, player.y);
    let isMovingLeft = Math.abs(player.angle) > Math.PI / 2;
    if (isMovingLeft) { ctx.scale(-1, 1); ctx.rotate(Math.PI - player.angle); } else ctx.rotate(player.angle);
    let subColor = '#4CAF50'; let subDark = '#2e7d32'; let subHighlight = '#81c784';
    if (player.invulnTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) { subColor = '#ff5555'; subDark = '#cc0000'; subHighlight = '#ff8888'; }
    ctx.fillStyle = subDark; ctx.beginPath(); ctx.ellipse(0, 2, player.radius * 2, player.radius * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = subColor; ctx.beginPath(); ctx.ellipse(0, 0, player.radius * 2, player.radius * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = subHighlight; ctx.beginPath(); ctx.ellipse(0, -3, player.radius * 1.5, player.radius * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = subDark; ctx.fillRect(-player.radius * 0.4, -player.radius * 2, player.radius * 1.2, player.radius * 1.2);
    ctx.fillStyle = subColor; ctx.fillRect(-player.radius * 0.4, -player.radius * 2.2, player.radius * 1.2, player.radius * 0.4);
    ctx.fillStyle = '#01579b'; ctx.beginPath(); ctx.arc(player.radius * 0.2, -player.radius * 1.5, player.radius * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#81d4fa'; ctx.beginPath(); ctx.arc(player.radius * 0.2, -player.radius * 1.5, player.radius * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(player.radius * 0.1, -player.radius * 1.6, player.radius * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = subDark; ctx.beginPath(); ctx.moveTo(-player.radius * 1.5, 0); ctx.lineTo(-player.radius * 2.8, -player.radius * 1.5); ctx.lineTo(-player.radius * 2.2, 0); ctx.lineTo(-player.radius * 2.8, player.radius * 1.5); ctx.fill();
    ctx.fillStyle = '#424242'; ctx.fillRect(-player.radius * 3.0, -player.radius * 0.4, player.radius * 0.8, player.radius * 0.8);
    ctx.fillStyle = '#bdbdbd'; let propScale = Math.abs(Math.sin(Date.now() / 30)); ctx.fillRect(-player.radius * 3.2, -player.radius * 1.2 * propScale, player.radius * 0.4, player.radius * 2.4 * propScale);
    ctx.restore();
    const startCol = Math.max(0, Math.floor(cameraX / cellSize));
    const endCol = Math.min(worldCols, Math.ceil((cameraX + canvas.width) / cellSize));
    const startRow = Math.max(0, Math.floor(cameraY / cellSize));
    const endRow = Math.min(worldRows, Math.ceil((cameraY + canvas.height) / cellSize));

    for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
            let type = maze[r][c];
            if (type === 1 || type === 2) {
                let cellCenterX = c * cellSize + cellSize/2; let cellCenterY = r * cellSize + cellSize/2;
                let bNormal = 0, bMine = 0;
                for(let p of pings) {
                    let dist = Math.hypot(p.x - cellCenterX, p.y - cellCenterY); let diff = Math.abs(dist - p.radius);
                    if (diff < cellSize * 1.5) {
                        let brightness = (1 - diff / (cellSize * 1.5)) * p.opacity;
                        if (p.type === 'mine') bMine = Math.max(bMine, brightness); else bNormal = Math.max(bNormal, brightness);
                    }
                }
                if (bNormal > 0.05 || bMine > 0.05) {
                    if (type === 1) {
                        let red = Math.min(255, bMine * 255), green = Math.min(255, bNormal * 150), blue = Math.min(255, bNormal * 255);
                        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${Math.max(bNormal, bMine)})`;
                        let sRed = Math.min(255, bMine * 255), sGreen = Math.min(255, bNormal * 255), sBlue = Math.min(255, bNormal * 255);
                        ctx.strokeStyle = `rgba(${sRed}, ${sGreen}, ${sBlue}, ${Math.max(bNormal, bMine)})`;
                        ctx.lineWidth = 2; ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize); ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    } else if (type === 2) {
                        let b = Math.max(bNormal, bMine);
                        ctx.fillStyle = `rgba(139, 69, 19, ${b})`; ctx.fillRect(c * cellSize + 5, r * cellSize + 15, cellSize - 10, cellSize - 20);
                        ctx.beginPath(); ctx.arc(c * cellSize + cellSize / 2, r * cellSize + 15, (cellSize - 10) / 2, Math.PI, 0); ctx.fill();
                        ctx.strokeStyle = `rgba(255, 215, 0, ${b})`; ctx.lineWidth = 2; ctx.strokeRect(c * cellSize + 5, r * cellSize + 15, cellSize - 10, cellSize - 20);
                        ctx.beginPath(); ctx.arc(c * cellSize + cellSize / 2, r * cellSize + 15, (cellSize - 10) / 2, Math.PI, 0); ctx.stroke();
                        ctx.fillStyle = `rgba(218, 165, 32, ${b})`; ctx.fillRect(c * cellSize + cellSize / 2 - 3, r * cellSize + 12, 6, 8);
                    }
                }
            }
        }
    }
    for (let m of mines) {
        if (m.x < cameraX - cellSize || m.x > cameraX + canvas.width + cellSize ||
            m.y < cameraY - cellSize || m.y > cameraY + canvas.height + cellSize) continue;
        let maxBrightness = 0;
        for(let p of pings) { let dist = Math.hypot(p.x - m.x, p.y - m.y); let diff = Math.abs(dist - p.radius); if (diff < cellSize * 1.5) maxBrightness = Math.max(maxBrightness, (1 - diff / (cellSize * 1.5)) * p.opacity); }
        if (maxBrightness > 0.05) {
            ctx.fillStyle = `rgba(255, 50, 50, ${maxBrightness})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(255, 100, 100, ${maxBrightness})`; ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) { let angle = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(angle) * m.radius, m.y + Math.sin(angle) * m.radius); ctx.lineTo(m.x + Math.cos(angle) * (m.radius + 4), m.y + Math.sin(angle) * (m.radius + 4)); ctx.stroke(); }
        }
    }
    for(let p of pings) {
        if (p.x + p.radius < cameraX || p.x - p.radius > cameraX + canvas.width || 
            p.y + p.radius < cameraY || p.y - p.radius > cameraY + canvas.height) continue;
        if (p.type === 'mine') ctx.strokeStyle = `rgba(255, 50, 50, ${p.opacity * 0.7})`; else ctx.strokeStyle = `rgba(150, 255, 150, ${p.opacity * 0.5})`;
        ctx.lineWidth = p.type === 'mine' ? 3 : 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}

const torpedoUICanvas = document.getElementById('torpedoUICanvas');
const torpedoUICtx = torpedoUICanvas ? torpedoUICanvas.getContext('2d') : null;

function drawTorpedoUI() {
    if (!torpedoUICtx) return;
    torpedoUICtx.clearRect(0, 0, torpedoUICanvas.width, torpedoUICanvas.height);
    torpedoUICtx.strokeStyle = torpedoTimer <= 0 ? '#4CAF50' : '#ff3333';
    torpedoUICtx.lineWidth = 2; torpedoUICtx.beginPath(); torpedoUICtx.ellipse(20, 7.5, 12, 4, 0, 0, Math.PI * 2); torpedoUICtx.stroke();
    torpedoUICtx.strokeRect(3, 5.5, 5, 4);
    if (torpedoTimer <= 0) { torpedoUICtx.fillStyle = '#4CAF50'; torpedoUICtx.beginPath(); torpedoUICtx.ellipse(20, 7.5, 12, 4, 0, 0, Math.PI * 2); torpedoUICtx.fill(); torpedoUICtx.fillRect(3, 5.5, 5, 4); }
    else {
        let progress = 1.0 - (torpedoTimer / torpedoReloadTime); torpedoUICtx.fillStyle = '#ff3333';
        torpedoUICtx.save(); torpedoUICtx.beginPath(); torpedoUICtx.rect(0, 0, 40 * progress, 15); torpedoUICtx.clip();
        torpedoUICtx.beginPath(); torpedoUICtx.ellipse(20, 7.5, 12, 4, 0, 0, Math.PI * 2); torpedoUICtx.fill(); torpedoUICtx.fillRect(3, 5.5, 5, 4); torpedoUICtx.restore();
    }
}

function gameLoop(time) {
    if (gameState !== 'playing') return;
    let dt = (time - lastFrame) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastFrame = time;
    timeElapsed = (Date.now() - startTime) / 1000;
    currentTimeEl.innerText = timeElapsed.toFixed(1);
    if (torpedoTimer > 0) { torpedoTimer -= dt; if (torpedoTimer < 0) torpedoTimer = 0; }
    drawTorpedoUI(); handlePhysics(dt, time); handlePings(dt); drawScene();
    requestAnimationFrame(gameLoop);
}

function endGame(win = true) {
    gameState = 'over'; toggleMobileControls(false); stopBackgroundAudio();
    if (win) {
        playWinSound(); endGameTitle.innerText = 'Escaped!'; endGameTitle.className = 'game-win-title';
        statsBox.classList.remove('hidden'); saveScoreBtn.classList.remove('hidden'); playerNameInput.classList.remove('hidden');
        let baseTime = parseFloat(timeElapsed.toFixed(2));
        let pPenalty = (freePings !== -1 && pingsUsed > freePings) ? (pingsUsed - freePings) * penaltyPerPing : 0;
        pPenalty += mineHits * penaltyPerMine;
        finalTotalScore = parseFloat((baseTime + pPenalty).toFixed(2));
        baseTimeEl.innerText = baseTime.toFixed(2);
        penaltyTimeEl.innerText = pPenalty.toFixed(2);
        finalTimeEl.innerText = finalTotalScore.toFixed(2);
    } else {
        playExplosionSound(); endGameTitle.innerText = 'Destroyed!'; endGameTitle.className = 'game-over-title';
        statsBox.classList.add('hidden'); saveScoreBtn.classList.add('hidden'); playerNameInput.classList.add('hidden');
    }
    saveScoreBtn.disabled = false; saveScoreBtn.textContent = 'Save Time'; gameOverScreen.classList.remove('hidden');
}

const mobileControls = document.getElementById('mobile-controls');
const joystickContainer = document.getElementById('joystick-container');
const joystickKnob = document.getElementById('joystick-knob');
const btnPing = document.getElementById('btn-ping');
const btnFire = document.getElementById('btn-fire');

let joystickActive = false; let joystickStartX = 0; let joystickStartY = 0; let joystickMaxDist = 40;

function handleJoystick(e) {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    let dx = touch.clientX - joystickStartX; let dy = touch.clientY - joystickStartY;
    const dist = Math.hypot(dx, dy);
    if (dist > joystickMaxDist) { const angle = Math.atan2(dy, dx); dx = Math.cos(angle) * joystickMaxDist; dy = Math.sin(angle) * joystickMaxDist; }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    const threshold = 0.3; const nx = dx / joystickMaxDist; const ny = dy / joystickMaxDist;
    keys.a = nx < -threshold; keys.d = nx > threshold; keys.w = ny < -threshold; keys.s = ny > threshold;
}

joystickContainer.addEventListener('touchstart', (e) => { const touch = e.touches[0]; joystickActive = true; joystickStartX = touch.clientX; joystickStartY = touch.clientY; joystickKnob.style.transition = 'none'; }, { passive: false });
joystickContainer.addEventListener('touchmove', handleJoystick, { passive: false });
const stopJoystick = () => { joystickActive = false; joystickKnob.style.transition = 'transform 0.2s ease-out'; joystickKnob.style.transform = 'translate(0, 0)'; keys.w = keys.a = keys.s = keys.d = false; };
joystickContainer.addEventListener('touchend', stopJoystick); joystickContainer.addEventListener('touchcancel', stopJoystick);
joystickContainer.addEventListener('mousedown', (e) => { joystickActive = true; joystickStartX = e.clientX; joystickStartY = e.clientY; joystickKnob.style.transition = 'none'; });
window.addEventListener('mousemove', (e) => { if (joystickActive) handleJoystick(e); });
window.addEventListener('mouseup', () => { if (joystickActive) stopJoystick(); });

if (btnPing) {
    btnPing.addEventListener('touchstart', (e) => { e.preventDefault(); keys.space = true; });
    btnPing.addEventListener('touchend', (e) => { e.preventDefault(); keys.space = false; });
    btnPing.addEventListener('mousedown', (e) => { e.preventDefault(); keys.space = true; });
    btnPing.addEventListener('mouseup', () => keys.space = false);
}
if (btnFire) {
    btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); fireTorpedo(); });
    btnFire.addEventListener('mousedown', (e) => { e.preventDefault(); fireTorpedo(); });
}

window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ') { e.preventDefault(); keys.space = true; }
    if (e.key === 'Shift') fireTorpedo();
});

window.addEventListener('mousedown', e => { 
    if (e.target === canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = mouseX + cameraX;
        const worldY = mouseY + cameraY;
        fireTorpedo(worldX, worldY);
    }
});
function fireTorpedo(targetX, targetY) {
    if (gameState !== 'playing') return;
    if (torpedoTimer <= 0) {
        let angle = player.angle;
        if (targetX !== undefined && targetY !== undefined) {
            angle = Math.atan2(targetY - player.y, targetX - player.x);
        }
        torpedoes.push({ x: player.x + Math.cos(angle) * player.radius * 2, y: player.y + Math.sin(angle) * player.radius * 2, angle: angle, speed: cellSize * 7.5 });
        torpedoTimer = torpedoReloadTime; playTorpedoSound();
    }
}
window.addEventListener('keyup', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false; if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false; if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === ' ') keys.space = false;
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', () => { uiOverlay.classList.remove('hidden'); gameOverScreen.classList.add('hidden'); toggleMobileControls(false); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); });

// Settings Event Listeners
if (settingsBtn) settingsBtn.addEventListener('click', () => { settingsOverlay.classList.remove('hidden'); });
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => { settingsOverlay.classList.add('hidden'); });
if (musicToggle) musicToggle.addEventListener('change', (e) => { audioSettings.musicEnabled = e.target.checked; saveSettings(); });
if (sfxToggle) sfxToggle.addEventListener('change', (e) => { audioSettings.sfxEnabled = e.target.checked; saveSettings(); });
if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', (e) => { audioSettings.musicVolume = parseFloat(e.target.value); saveSettings(); });
if (sfxVolumeSlider) sfxVolumeSlider.addEventListener('input', (e) => { audioSettings.sfxVolume = parseFloat(e.target.value); saveSettings(); });

async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/scores'); const scores = await res.json();
        leaderboardEl.innerHTML = '';
        scores.forEach(s => { const li = document.createElement('li'); li.textContent = `${s.name}: ${s.score.toFixed(2)}s`; leaderboardEl.appendChild(li); });
    } catch (e) { console.error('Error:', e); }
}

saveScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim() || 'Diver';
    try {
        await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, score: finalTotalScore }) });
        playerNameInput.value = ''; await fetchLeaderboard(); saveScoreBtn.disabled = true; saveScoreBtn.textContent = 'Saved!';
    } catch (e) {}
});

loadSettings();
fetchLeaderboard();
window.addEventListener('resize', resizeCanvas);
document.addEventListener('fullscreenchange', resizeCanvas);
resizeCanvas();
ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);

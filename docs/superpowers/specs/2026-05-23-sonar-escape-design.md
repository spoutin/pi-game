# Sonar Escape - Game Design

## Overview
"Sonar Escape" is a unique browser-based puzzle/exploration game. The player controls a small submarine in pitch-black waters. The only way to see the environment (walls, hazards, and the goal) is to emit a sonar "ping" which temporarily illuminates the surrounding area before fading back to darkness. The goal is to navigate the maze and reach the exit in the fastest time possible.

## Architecture
- **Frontend:** HTML5, CSS3, Vanilla JavaScript. Uses the Canvas API for rendering the dynamic lighting (sonar) effect and physics.
- **Backend:** Node.js with Express framework.
- **Data Storage:** Reusing the JSON flat file (`data/scores.json`) to persist the top 10 fastest times.

## Mechanics
- **Movement:** WASD or Arrow Keys. Smooth acceleration and friction (drifting in water).
- **Sonar:** Press Spacebar or Left Click to emit a ping. A ring expands outward from the player, revealing the color and shape of obstacles it passes over. The illumination fades after a few seconds. Pings have a short cooldown.
- **Environment:**
  - **Walls:** Solid boundaries (blue/green outline when pinged).
  - **Goal:** A glowing beacon (yellow/gold when pinged).
- **Win Condition:** Reaching the goal stops the timer. The player can submit their time to the leaderboard.

## Data Flow
- **Start:** Page loads, fetches leaderboard times (ordered ascending, lowest is best).
- **Gameplay:** Timer starts on first movement.
- **End:** Player touches the goal, timer stops. Score (time in milliseconds) is submitted.

## Why it's unique
Unlike traditional arcade games, the player is blind most of the time and has to rely on spatial memory and timing their sonar pings to navigate without crashing into dead ends.

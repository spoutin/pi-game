# Sonar Escape

**Sonar Escape** is an experimental, browser-based atmospheric survival game. This project was developed entirely by AI (OpenCode), following the strategic direction and iterative prompting of a human collaborator.

## Overview

In *Sonar Escape*, the player commands a submarine navigating the pitch-black depths of a hazardous underwater maze. The core gameplay loop revolves around limited visibility and spatial memory; the environment is only revealed through the emission of sonar "pings," which temporarily illuminate obstacles and threats before they fade back into the abyss.

The mission is to navigate the maze, avoid lethal mines and surface-deployed depth charges, and reach the treasure chest at the exit in the fastest time possible.

## Features

- **Atmospheric Sonar Mechanics:** Utilize active sonar to reveal walls, mines, and goals.
- **Dynamic Physics:** Experience realistic underwater movement with momentum, drift, and rotation.
- **Threat System:**
    - **Stationary Mines:** Silent, invisible hazards that deplete health upon collision.
    - **Surface Ships:** Hostile vessels that patrol the surface and deploy depth charges.
    - **Depth Charges:** Fast-falling projectiles that bypass terrain to target the player.
- **Defensive Systems:** Deployable torpedoes with difficulty-scaled reload timers to clear mines and depth charges.
- **Health System:** A 3-point hull integrity system with localized invulnerability frames.
- **Global Leaderboard:** A persistent high-score system tracking the fastest escape times.
- **Fully Responsive:** Scale-independent rendering engine that supports everything from desktop monitors to mobile devices with virtual on-screen controls.
- **Dynamic HUD:** A modern, non-intrusive interface tracking health, time, pings, and torpedo status.

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5 Canvas API, CSS3.
- **Backend:** Node.js, Express.js.
- **Audio:** Web Audio API (Synthesized SFX).
- **Data Persistence:** JSON-based flat-file storage.
- **Deployment:** Dockerized for compatibility with cloud providers like Fly.io and Render.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Deployment

The project includes a `Dockerfile` for rapid deployment to cloud environments.

### Deploying to Render (Web Service)
1. Connect your GitHub repository to Render.
2. Select **Web Service**.
3. Use the following settings:
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

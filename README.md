# HyperChAT

A decentralized, peer-to-peer web chat application built with Node.js and Hyperswarm.

**No servers. No accounts. Just peer-to-peer chat.**

Chat directly with others using distributed hash table (DHT) technology - no central server required. Run it with Docker or Node.js.

## Features

- **Decentralized P2P**: No central server - peers connect directly via Hyperswarm DHT
- **Room-based chat**: Join different chat rooms by name
- **Anti-impersonation**: Each user has a unique cryptographic peer ID
- **Real-time messaging**: Instant peer discovery and message delivery via WebSocket
- **Web-based UI**: Modern, responsive interface accessible from any browser
- **Privacy-focused**: Direct encrypted connections between peers
- **Docker support**: Easy deployment with Docker or Docker Compose

## Quick Start

### Prerequisites

- **Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/Mac) or [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) (Linux)
- **Git**: For cloning the repository

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/appuruguru/hyperchat.git
cd hyperchat
```

**2. Run with Docker Compose (Recommended):**
```bash
# Start the application
docker compose up

# Or run in background (detached mode)
docker compose up -d

# To stop
docker compose down
```

Then open http://localhost:3030 in your browser.

**Note:** If port 3030 is already in use, edit `docker-compose.yml` and change the first port number:
```yaml
ports:
  - "3031:3000"  # Use port 3031 instead
```

### Alternative: Run with Node.js

**1. Clone the repository:**
```bash
git clone https://github.com/appuruguru/hyperchat.git
cd hyperchat
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start the server:**
```bash
npm start
```

Then open http://localhost:3000 in your browser.

**Note:** If port 3000 is already in use, set a different port:
```bash
# Windows PowerShell
$env:PORT=3001; npm start

# Linux/Mac
PORT=3001 npm start
```

## How It Works

1. **Enter username and room name** - Choose any username and join a chat room
2. **Peer Discovery** - Hyperswarm creates a topic (hash of room name) and announces your presence to the DHT
3. **Direct Connection** - Other peers in the same room discover you and establish direct P2P connections
4. **Encrypted Messaging** - Messages are sent directly between peers over encrypted connections
5. **Unique Identity** - Your username is displayed with a cryptographic peer ID (e.g., "alice (a3f2b1)") to prevent impersonation

## Requirements

- **Docker** (recommended): For containerized deployment
- **Node.js**: Version 20 or higher (optional, if running without Docker)

## Project Structure

```
hyperchat/
├── server.js              # Node.js + Express + WebSocket server
├── public/                # Frontend web application
│   ├── index.html         # Main HTML
│   ├── style.css          # Styles
│   └── app.js            # Client-side JavaScript
├── Dockerfile            # Docker image configuration
├── docker-compose.yml    # Docker Compose configuration
└── package.json          # Dependencies
```

## Technology Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **P2P Networking**: Hyperswarm (DHT-based peer discovery)
- **Deployment**: Docker

## Usage

1. **Start the application** using Docker Compose or Node.js
2. **Open your browser** to http://localhost:3030 (or http://localhost:3000 if running with Node.js directly)
3. **Enter a username** and **room name**
4. **Start chatting!** Other users in the same room will automatically connect via P2P

Each user runs their own instance locally. The P2P connections happen directly between users via Hyperswarm DHT.

## Common Issues

**Port already in use:**
- Edit `docker-compose.yml` and change `"3030:3000"` to `"3031:3000"` (or any available port)
- Access the app at the new port: http://localhost:3031

**Docker command not found:**
- Make sure Docker Desktop is installed and running
- On Linux, you may need to run with `sudo` or add your user to the docker group

**Older Docker versions:**
- If `docker compose` doesn't work, try `docker-compose` (with a dash)

## Development

```bash
npm install
npm start
```

The server will start on port 3000. Any changes to `server.js` require a restart.

To rebuild Docker image after changes:
```bash
docker compose up --build
```

## License

MIT

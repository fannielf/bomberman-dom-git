import { broadcast } from "../server.js";

const players = new Map();
let readyTimer = null;

const gameState = {
  status: "waiting", // 'waiting' | 'countdown' | 'running' | 'ended'
  players: {}, // key = playerId
  map: {
    // Game map configuration
    width: 0,
    height: 0,
    tiles: [], // 2D array of 'empty' | 'wall' | 'block'
    powerUps: [], // [{x, y, type}]
  },
  bombs: [],
  explosions: [],
  lastUpdate: Date.now(),
};

// can be calculated from the grid if we don't want to hard code positions
const playerPositions = [
  { x: 1, y: 1 }, // Top-left
  { x: 13, y: 11 }, // Bottom-right
  { x: 13, y: 1 }, // Top-right
  { x: 1, y: 11 }, // Bottom-left
];

// adding a player to the game
function addPlayer(client) {
  if (
    players.has(client.id) ||
    players.size >= 4 ||
    gameState.status !== "countdown"
  )
    return; // Prevent re-adding and limit to 4 players

  const positionIndex = players.size;
  const position = playerPositions[positionIndex];

  players.set(client.id, {
    nickname: client.nickname,
    lives: 3,
    alive: true,
    position: { ...position },
    speed: 1, // Default speed
    bombRange: 1, // Default bomb range
    bombCount: 1, // Default bomb count
  });
}

function removePlayer(id) {
  players.delete(id);
}

export function deActivePlayer(id) {
  const player = players.get(id);
  if (!player) return;
  player.alive = false;
  player.position = null; // Remove position if player is deactivated
  lives = 0; // Reset lives
  broadcast({ type: "playerDeactivated", nickname: player.nickname });
}

function looseLife(id) {
  const player = players.get(id);
  if (!player) return;
  player.lives--;
  if (player.lives <= 0) {
    player.alive = false;
    player.position = null; // Remove position if player is eliminated
    removePlayer(id); // Remove player if lives reach 0
    broadcast({ type: "playerEliminated", nickname: player.nickname });
  }
}

function getPlayerState(id) {
  return players.get(id);
}

function updatePlayerPosition(id, position) {
  if (players.has(id)) {
    players.get(id).position = position;
    return true; // Add return value
  }
  return false;
}

export {
  players,
  gameState,
  addPlayer,
  removePlayer,
  looseLife,
  getPlayerState,
  updatePlayerPosition,
  playerPositions,
  startCountdown,
};

// New functions for game management
function startCountdown() {
  if (readyTimer) return;
  gameState.status = "countdown";
  let countdown = 10;

  // Generate the map when countdown starts
  gameState.map = generateGameMap();

  broadcast({ type: "readyTimer", countdown });

  readyTimer = setInterval(() => {
    countdown--;
    broadcast({ type: "readyTimer", countdown });

    if (countdown <= 0) {
      clearInterval(readyTimer);
      readyTimer = null;
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameState.status = "running";
  // Send the map to clients
  broadcast({
    type: "gameStarted",
    map: gameState.map,
    players: Array.from(players.values()),
  });
}

// Add the generateGameMap function here too
function generateGameMap() {
  const tiles = [];
  const width = 15;
  const height = 13;

  for (let row = 0; row < height; row++) {
    tiles[row] = [];
    for (let col = 0; col < width; col++) {
      if (row === 0 || row === height - 1 || col === 0 || col === width - 1) {
        tiles[row][col] = "wall";
      } else if (row % 2 === 0 && col % 2 === 0) {
        tiles[row][col] = "wall";
      } else if (
        (row <= 2 && col <= 2) ||
        (row <= 2 && col >= width - 3) ||
        (row >= height - 3 && col <= 2) ||
        (row >= height - 3 && col >= width - 3)
      ) {
        tiles[row][col] = "empty";
      } else if (Math.random() < 0.3) {
        tiles[row][col] = "destructible-wall";
      } else {
        tiles[row][col] = "empty";
      }
    }
  }
  return {
    width,
    height,
    tiles,
    powerUps: [],
  };
}

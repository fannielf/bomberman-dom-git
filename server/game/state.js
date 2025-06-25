import { broadcast } from "../server.js";

const players = new Map();
const playerPositions = [];
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
    id: client.id,
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
  removePlayer(id); // Remove player from the game
  if (players.size === 1) {
    // If only one player left, end the game
    const winner = Array.from(players.values())[0];
    gameState.status = "ended";
    broadcast({
      type: "gameEnded",
      winner: winner.nickname,
    });
  }
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

function handlePlayerMove(id, direction) {
  const player = players.get(id);
  if (!player || !player.alive) return;

  const { position } = player;
  const newPosition = { ...position };

  switch (direction) {
    case "up":
      newPosition.y -= 1;
      break;
    case "down":
      newPosition.y += 1;
      break;
    case "left":
      newPosition.x -= 1;
      break;
    case "right":
      newPosition.x += 1;
      break;
    default:
      return; // Invalid direction
  }

  if (isPositionValid(newPosition)) {
    player.position = newPosition;
    // Broadcast the move to all clients
    broadcast({ type: "playerMoved", id, position: newPosition });
  }
}

function isPositionValid({ x, y }) {
  if (!gameState.map.tiles) return false;
  // Check bounds
  if (y < 0 || y >= gameState.map.height || x < 0 || x >= gameState.map.width) {
    return false;
  }

  // Check for collisions with walls
  const tile = gameState.map.tiles[y][x];
  if (tile === "wall" || tile === "destructible-wall") {
    return false;
  }

  // Check for collisions with other players
  for (const p of players.values()) {
    if (p.alive && p.position && p.position.x === x && p.position.y === y) {
      return false;
    }
  }

  return true;
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
  handlePlayerMove,
};

// New functions for game management
function startCountdown() {
  if (readyTimer) return;
  gameState.status = "countdown";
  let countdown = 10;

  // Generate the map when countdown starts
  gameState.map = generateGameMap();
  playerPositions.length = 0; // Reset player positions
  playerPositions.push(...getPlayerPositions(gameState.map.tiles));

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


function getPlayerPositions(tiles) {
  const height = tiles.length;
  const width = tiles[0].length;

  const quadrants = [
    { xRange: [1, 3], yRange: [1, 3] }, // top-left
    { xRange: [width - 4, width - 2], yRange: [1, 3] }, // top-right
    { xRange: [1, 3], yRange: [height - 4, height - 2] }, // bottom-left
    { xRange: [width - 4, width - 2], yRange: [height - 4, height - 2] }, // bottom-right
  ];

  return quadrants.map(({ xRange, yRange }) => {
    for (let y = yRange[0]; y <= yRange[1]; y++) {
      for (let x = xRange[0]; x <= xRange[1]; x++) {
        if (tiles[y][x] === "empty") return { x, y };
      }
    }
    return { x: xRange[0], y: yRange[0] }; // fallback if no empty tile found
  });
}

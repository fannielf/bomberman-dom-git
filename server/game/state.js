import { chatHistory } from "../handlers/chat.js";
import { broadcast } from "../handlers/connection.js";

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
  if (!client || !client.id) {
    console.error("addPlayer: client or client.id is undefined", client);
    return;
  }
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
  checkGameEnd();
}

export function deActivePlayer(id) {
  const player = players.get(id);
  if (!player) return;
  player.alive = false;
  player.position = null; // Remove position if player is deactivated
  player.lives = 0; // Reset lives
  broadcast({ type: "playerDeactivated", nickname: player.nickname });
  //removePlayer(id); // Remove player from the game
  checkGameEnd();
}

function looseLife(id) {
  console.log("looseLife called for player:", id);
  const player = players.get(id);
  if (!player) return;
  player.lives--;
  if (player.lives <= 0) {
    console.log(`Player ${player.nickname} has been eliminated.`);
    player.lives = 0; // Ensure lives don't go negative
    player.alive = false;
    player.position = null; // Remove position if player is eliminated
    //removePlayer(id); // Remove player if lives reach 0
    broadcast({ type: "deActivePlayer", nickname: player.nickname, id: player.id });
    checkGameEnd();
  } else {
    broadcast({ type: "playerUpdate", player: { id: player.id, lives: player.lives } });
  }
}

function handlePlaceBomb(playerId) {
  const player = players.get(playerId);
  if (!player || !player.alive) return;

  // Check if player has an active bomb already
  const activeBombs = gameState.bombs.filter(
    (b) => b.ownerId === playerId
  ).length;
  if (activeBombs >= player.bombCount) {
    return;
  }

  // Prevent placing a bomb on a tile that already has one
  const isBombPresent = gameState.bombs.some(
    (b) =>
      b.position.x === player.position.x && b.position.y === player.position.y
  );
  if (isBombPresent) {
    return;
  }

  const bomb = {
    id: crypto.randomUUID(),
    ownerId: playerId,
    position: { ...player.position },
    timer: 3000, // 3 seconds
    range: player.bombRange,
  };

  gameState.bombs.push(bomb);
  broadcast({ type: "bombPlaced", bomb });

  // Schedule the explosion
  setTimeout(() => {
    explodeBomb(bomb.id);
  }, bomb.timer);
}

function explodeBomb(bombId) {
  console.log("Exploding bomb:", bombId);
  const bombIndex = gameState.bombs.findIndex((b) => b.id === bombId);
  if (bombIndex === -1) return;

  const [bomb] = gameState.bombs.splice(bombIndex, 1);
  const explosionTiles = new Set();
  const directions = [
    { x: 0, y: 0 }, // center
    { x: 1, y: 0 }, // right
    { x: -1, y: 0 }, // left
    { x: 0, y: 1 }, // down
    { x: 0, y: -1 }, // up
  ];

  explosionTiles.add(`${bomb.position.x},${bomb.position.y}`);

  // Calculate explosion in each direction
  for (const dir of directions.slice(1)) {
    const x = bomb.position.x + dir.x;
    const y = bomb.position.y + dir.y;

    if (
      y < 0 ||
      y >= gameState.map.height ||
      x < 0 ||
      x >= gameState.map.width
    )
      continue;

    const tile = gameState.map.tiles[y][x];
    if (tile === "wall") continue;

    explosionTiles.add(`${x},${y}`);

    if (tile === "destructible-wall") {
      gameState.map.tiles[y][x] = "empty";
    }
  }

  // Check for players hit by the explosion
  const hitPlayers = [];
  for (const player of players.values()) {
    if (!player.alive || !player.position) continue;
    const key = `${player.position.x},${player.position.y}`;
    if (explosionTiles.has(key)) {
      hitPlayers.push(player);
    }
  }

  // renew the lives and status of players hit by the explosion
    for (const player of hitPlayers) {
      looseLife(player.id);
    }

  const explosion = {
    id: crypto.randomUUID(),
    tiles: Array.from(explosionTiles).map((t) => {
      const [x, y] = t.split(",").map(Number);
      return { x, y };
    }),
  };

  gameState.explosions.push(explosion);

  broadcast({
    type: "explosion",
    bombId: bomb.id,
    explosion,
    updatedMap: gameState.map,
  });

  // Remove the explosion visual after a short time
  setTimeout(() => {
    const explosionIndex = gameState.explosions.findIndex(
      (e) => e.id === explosion.id
    );
    if (explosionIndex !== -1) {
      gameState.explosions.splice(explosionIndex, 1);
      broadcast({ type: "explosionEnded", explosionId: explosion.id });
    }
  }, 500);
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
  handlePlaceBomb,
  resetGameState,
};

// New functions for game management
function startCountdown() {
  if (readyTimer) return;
  gameState.status = "countdown";
  let countdown = 10;

  // Generate the map when countdown starts
  gameState.map = generateGameMap();
  playerPositions.length = 0; // Reset player positions
  playerPositions.push(...getPlayerPositions());

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
    chatHistory,
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
      // The order of these checks is important.
      // 1. Set outer walls.
      if (row === 0 || row === height - 1 || col === 0 || col === width - 1) {
        tiles[row][col] = "wall";
      // 2. Clear spawn corners. This must happen before pillar or destructible walls are placed.
      } else if (
        (row <= 2 && col <= 2) ||
        (row <= 2 && col >= width - 3) ||
        (row >= height - 3 && col <= 2) ||
        (row >= height - 3 && col >= width - 3)
      ) {
        tiles[row][col] = "empty";
      // 3. Set inner "pillar" walls.
      } else if (row % 2 === 0 && col % 2 === 0) {
        tiles[row][col] = "wall";
      // 4. Place random destructible walls.
      } else if (Math.random() < 0.3) {
        tiles[row][col] = "destructible-wall";
      // 5. Fill the rest with empty space.
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


function getPlayerPositions() {
  const width = 15;
  const height = 13;

  // Define the exact corner positions for each player.
  const positions = [
    { x: 1, y: 1 }, // Player 1: Top-Left
    { x: width - 2, y: 1 }, // Player 2: Top-Right
    { x: 1, y: height - 2 }, // Player 3: Bottom-Left
    { x: width - 2, y: height - 2 }, // Player 4: Bottom-Right
  ];

  return positions;
}

function checkGameEnd() {
  const alivePlayers = Array.from(players.values()).filter(p => p.alive);
  if (alivePlayers.length === 1) {
    const winner = alivePlayers[0];
    gameState.status = "ended";
    broadcast({
      type: "gameEnded",
      winner: winner.nickname,
    });
    setTimeout(() => {
      resetGameState();
      broadcast({ type: "gameReset" });
    }, 2000);
  }
}

function resetGameState() {
  players.clear();
  gameState.status = "waiting";
  playerPositions.length = 0;
  gameState.players = {};
  gameState.bombs = [];
  gameState.explosions = [];
  gameState.map = {
    width: 0,
    height: 0,
    tiles: [],
    powerUps: [],
  };
}


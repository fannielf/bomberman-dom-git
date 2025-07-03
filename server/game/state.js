import { chatHistory } from "../handlers/chat.js";
import { broadcast, clients, sendMsg } from "../handlers/connection.js";

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
    tiles: [], // 2D array of 'empty' | 'wall' | 'destructible-wall'
    powerUps: [], // [{x, y, type}]
  },
  bombs: [],
  explosions: [],
  powerUpCounts: { bomb: 4, flame: 4, speed: 2 },
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
    avatar: "player" + (positionIndex + 1), // Assign an avatar based on position
    lives: 3,
    alive: true,
    position: { ...position },
    speed: 1, // Default speed
    bombRange: 1, // Default bomb range
    bombCount: 1, // Default bomb count
    tempPowerUps: [],
  });
}

function removePlayer(id) {
  players.delete(id);
  checkGameEnd();
  if (players.size === 0) {
    resetGameState();
    broadcast({ type: "gameReset" });
  }
}

export function deActivatePlayer(id) {
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
    broadcast({ type: "deActivatePlayer", nickname: player.nickname, id: player.id });
    checkGameEnd();
  } else {
    broadcast({
      type: "playerUpdate",
      player: { id: player.id, lives: player.lives },
    });
  }
}

function handlePlaceBomb(playerId) {
  const player = players.get(playerId);
  if (!player || !player.alive) return;

  // Use player's current bomb count (no temp power-ups)
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

  // Use player's current bomb range (no temp power-ups)
  const bomb = {
    id: crypto.randomUUID(),
    ownerId: playerId,
    position: { ...player.position },
    timer: 3000,
    range: player.bombRange, // Use direct range
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
    for (let i = 1; i <= bomb.range; i++) { // Use bomb.range instead of fixed distance
      const x = bomb.position.x + (dir.x * i);
      const y = bomb.position.y + (dir.y * i);

      if (y < 0 || y >= gameState.map.height || x < 0 || x >= gameState.map.width)
        break;

      const tile = gameState.map.tiles[y][x];
      if (tile === "wall") break; // Stop at walls

      explosionTiles.add(`${x},${y}`);

      if (tile === "destructible-wall") {
        gameState.map.tiles[y][x] = "empty";
        
        // 30% chance to spawn power-up if any remaining
        if (Math.random() < 0.3) {
          const availableTypes = [];
          if (gameState.powerUpCounts.bomb > 0) availableTypes.push("bomb");
          if (gameState.powerUpCounts.flame > 0) availableTypes.push("flame");
          if (gameState.powerUpCounts.speed > 0) availableTypes.push("speed");
          
          if (availableTypes.length > 0) {
            const powerUpType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            
            gameState.map.powerUps.push({
              id: crypto.randomUUID(),
              type: powerUpType,
              x: x,
              y: y,
            });
            
            // Decrease the count
            gameState.powerUpCounts[powerUpType]--;
          }
        }
        break; // Stop at destructible walls
      }
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
    players: Array.from(players.values()),
  });

  // // Remove the explosion visual after a short time
  // setTimeout(() => {
  //   const explosionIndex = gameState.explosions.findIndex(
  //     (e) => e.id === explosion.id
  //   );
  //   if (explosionIndex !== -1) {
  //     gameState.explosions.splice(explosionIndex, 1);
  //     broadcast({ type: "explosionEnded", explosionId: explosion.id });
  //   }
  // }, 500);
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

// Add movement cooldown tracking
const playerMoveCooldowns = new Map();

function handlePlayerMove(id, direction) {
  const player = players.get(id);
  if (!player || !player.alive) return;

  // Check movement cooldown based on player speed
  const now = Date.now();
  const lastMoveTime = playerMoveCooldowns.get(id) || 0;
  const baseCooldown = 200; // Base 200ms between moves (slower for testing)
  const speedCooldown = baseCooldown / player.speed; // Faster = shorter cooldown
  
  if (now - lastMoveTime < speedCooldown) {
    return; // Still in cooldown, ignore move request
  }

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
    const oldPosition = player.position;
    player.position = newPosition;
    playerMoveCooldowns.set(id, now); // Update last move time

    // Check for power-up pickup
    const powerUpIndex = gameState.map.powerUps.findIndex(
      (p) => p.x === newPosition.x && p.y === newPosition.y
    );

    if (powerUpIndex !== -1) {
      const powerUp = gameState.map.powerUps[powerUpIndex];

      if (powerUp.type === "bomb") {
        // Permanent bomb count increase
        player.bombCount += 1;
      } else if (powerUp.type === "flame") {
        // Permanent range increase
        player.bombRange += 1;
      } else if (powerUp.type === "speed") {
        // Permanent speed increase (50% faster)
        player.speed = Math.round(player.speed * 1.5);
      }

      gameState.map.powerUps.splice(powerUpIndex, 1);

      broadcast({
        type: "powerUpPickup",
        playerId: id,
        powerUpId: powerUp.id,
        newPowerUps: gameState.map.powerUps,
      });
    }

    broadcast({ type: "playerMoved", id, position: newPosition, oldPosition });
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

  // // Check for collisions with other players
  // for (const p of players.values()) {
  //   if (p.alive && p.position && p.position.x === x && p.position.y === y) {
  //     return false;
  //   }
  // }

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
      if (players.size < 2) {
        // reset countdown
      }
      clearInterval(readyTimer);
      broadcast({ type: "gameState" });
      readyTimer = null;
    }
  }, 10);
}

export function startGame(ws = null) {
  gameState.status = "running";
  const message = {
    type: "gameStarted",
    map: gameState.map,
    players: Array.from(players.values()),
    chatHistory,
  }

  if (ws) {
    sendMsg(ws, message);
  } else {
    broadcast(message);
  }
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
      // 3. Set inner "pillar" walls.
      } else if (row % 2 === 0 && col % 2 === 0) {
        tiles[row][col] = "wall";
      // 4. Place random destructible walls.
      } else if (
        Math.random() < 0.5 &&
        !(
          // Top-left
          ( (row === 1 && col === 1) || (row === 1 && col === 2) || (row === 2 && col === 1) ) ||
          // Top-right
          ( (row === 1 && col === 13) || (row === 1 && col === 12) || (row === 2 && col === 13) ) ||
          // Bottom-left
          ( (row === 11 && col === 1) || (row === 11 && col === 2) || (row === 10 && col === 1) ) ||
          // Bottom-right
          ( (row === 11 && col === 13) || (row === 11 && col === 12) || (row === 10 && col === 13) )
        )
      ) {
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

function resetGameState() {
  players.clear();
  clients.clear();
  gameState.status = "waiting";
  gameState.players = {};
  gameState.bombs = [];
  gameState.explosions = [];
  gameState.map = { width: 0, height: 0, tiles: [], powerUps: [] };
  gameState.powerUpCounts = { bomb: 4, flame: 4, speed: 2 };
}

function checkGameEnd() {
  const alivePlayers = Array.from(players.values()).filter((p) => p.alive);
  if (alivePlayers.length === 1) {
    const winner = alivePlayers[0];
    gameState.status = "ended";
    broadcast({
      type: "gameEnded",
      winner: winner.nickname,
    });
    chatHistory.length = 0; // Clear chat when game ends

    setTimeout(resetGameState, 2000);
  }
}


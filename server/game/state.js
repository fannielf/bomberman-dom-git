import { broadcast } from "../server.js";

const players = new Map(); // unique id -> { nickname, lives, position, etc. }

const gameState = {
  status: 'waiting',  // 'waiting' | 'countdown' | 'running' | 'ended'
  players: {},       // key = playerId
  map: {              // Game map configuration 
    width: 13,
    height: 11,
    tiles: [],       // 2D array of 'empty' | 'wall' | 'block'
    powerUps: [],    // [{x, y, type}]
  },
  bombs: [],         // [{x, y, ownerId, timer, range}]
  explosions: [],    // [{x, y, createdAt}]
  lastUpdate: Date.now()
};

// can be calculated from the grid if we don't want to hard code positions
const playerPositions = [
    { x: 1, y: 1 },              // Top-left
    { x: 11, y: 9 },             // Bottom-right
    { x: 11, y: 1 },             // Top-right
    { x: 1, y: 9 },              // Bottom-left
];

// startCountdown function to initiate the game countdown and add players to the game state
export function startCountdown() {
  gameState.status = 'countdown';
  gameState.countdown = 10; // Set countdown to 10 seconds
  broadcast({ type: 'gameStateUpdate', state: gameState });
  
  const countdownInterval = setInterval(() => {
    if (gameState.countdown > 0) {
      gameState.countdown--;
      broadcast({ type: 'countdown', countdown: gameState.countdown });
    } else {
      clearInterval(countdownInterval);
      gameState.status = 'running';
      broadcast({ type: 'startGame' });
      // Initialize game state here if needed
    }
  }, 1000);

}

// adding a player to the game
function addPlayer(client) {
  if (players.has(client.id) || players.size >= 4 || gameState.status !== 'countdown') return; // Prevent re-adding and limit to 4 players

  const position = playerPositions[players.size];

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

function removePlayer(ws) {
  players.delete(ws);
}


function looseLife(id) {
    const player = players.get(id);
    if (!player) return;
    player.lives--;
    if (player.lives <= 0) {
      player.alive = false;
      player.position = null; // Remove position if player is eliminated
      removePlayer(ws); // Remove player if lives reach 0
      broadcast({ type: 'playerEliminated', nickname: player.nickname });
    }
}

function getPlayerState(id) {
  return players.get(id);
}

function updatePlayerPosition(id, position) {
  if (players.has(id)) {
    players.get(id).position = position;
  }
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
};
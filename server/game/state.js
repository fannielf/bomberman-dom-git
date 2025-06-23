import { setState, getState } from '../../framework/index.js';

const players = new Map(); // unique id -> { nickname, lives, position, etc. }

function createInitialTiles(width, height) {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Border as wall, every other as block, rest empty
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        row.push('wall');
      } else if (y % 2 === 1 && x % 2 === 1) {
        row.push('block');
      } else {
        row.push('empty');
      }
    }
    tiles.push(row);
  }
  return tiles;
}



// can be calculated from the grid if we don't want to hard code positions
const playerPositions = [
    { x: 1, y: 1 },              // Top-left
    { x: 11, y: 9 },             // Bottom-right
    { x: 11, y: 1 },             // Top-right
    { x: 1, y: 9 },              // Bottom-left
];

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
  gameState.players = Object.fromEntries(players);
  setState(gameState);
}

function removePlayer(ws) {
  players.delete(ws);
  gameState.players = Object.fromEntries(players);
  setState(gameState);
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

const gameState = {
  status: 'waiting',  // 'waiting' | 'countdown' | 'running' | 'ended'
  players: {},       // key = socket.id or playerId
  map: {              // Game map configuration 
    width: 13,
    height: 11,
    tiles: createInitialTiles(13, 11),       // 2D array of 'empty' | 'wall' | 'block'
    powerUps: [],    // [{x, y, type}]
  },
  bombs: [],         // [{x, y, ownerId, timer, range}]
  explosions: [],    // [{x, y, createdAt}]
  lastUpdate: Date.now()
};

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
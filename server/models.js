export const players = new Map(); // ws -> { nickname, lives, position }

export const gameState = {
  status: 'waiting', // 'waiting' | 'countdown' | 'running' | 'ended'
  players: {},       // key = socket.id or playerId
  map: {
    width: 13,
    height: 11,
    tiles: [],       // 2D array of 'empty' | 'wall' | 'block'
    powerUps: [],    // [{x, y, type}]
  },
  bombs: [],         // [{x, y, ownerId, timer, range}]
  explosions: [],    // [{x, y, createdAt}]
  lastUpdate: Date.now()
};

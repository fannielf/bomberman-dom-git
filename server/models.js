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
// models

export class Player {
    constructor(id, x, y) {
        this.id = id; // id for player, data id?
        this.nickname = ""; // nickname for player, based on the id?
        this.x = x;
        this.y = y;
        this.lives = 3;
        this.speed = 1; // number of "tiles" player can move per tick
        this.bombs = 1; // number of bombs player can place
        this.range = 1; // range of explosion 1 "tile" in each direction for example
        this.alive = true;
    }
}

export class Bomb {
    constructor(id, ownerId, x, y, timer = 2000) { // 2 secs
        this.id = id; // id for bomb?
        this.ownerId = ownerId; // id of player who placed the bomb
        this.x = x;
        this.y = y;
        this.timer = timer;
        this.range = 1; // initial range
    }
}

export class PowerUp {
    constructor(id, type, x, y) {
        this.id = id,
        this.type = type; // bomb, speed or range
        this.x = x;
        this.y = y;
    }
}

export class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = []; // empty, wall, block, powerup, explosion, player
    }
    isPassable(x, y) {
        return this.tiles[y]?.[x] === 'empty';
    }

    // if "empty" then it could be empty, powerup, player or explosion.
}

// game state ->
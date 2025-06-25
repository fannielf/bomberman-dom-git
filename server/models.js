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
    constructor(width, height, tiles) {
        this.width = width;
        this.height = height;
        this.tiles = tiles; // empty, wall, block, powerup, explosion, player
    }
    isPassable(x, y) {
    const tile = this.tiles[y]?.[x];
    return tile === "empty" || tile === "powerup" || tile === "explosion" || tile === "player";
  }

    // if "empty" then it could be empty, powerup, player or explosion.
}

// game state ->
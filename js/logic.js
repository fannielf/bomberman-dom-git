import { sendMessage } from "./ws.js";

// game loop and input handling logic
let gameLoopActive = false;
const keysPressed = new Set();
let lastMoveTime = 0;
const MOVE_INTERVAL = 100; // move every 100ms
export let gameEnded = false;

function handleKeyDown(e) {
  console.log("Key pressed:", e.key);
  // Prevent default browser actions for arrow keys
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === " ") {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      sendMessage({ type: "placeBomb", id: user.id });
    }
    return; // Don't add space to keysPressed
  }
  keysPressed.add(e.key.toLowerCase());
}

function handleKeyUp(e) {
  keysPressed.delete(e.key.toLowerCase());
}

function gameLoop(timestamp) {
  if (!gameLoopActive) return;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    stopGame();
    return;
  }

  // Throttle movement requests to avoid sending too many
  if (timestamp - lastMoveTime > MOVE_INTERVAL) {
    let direction = null;
    if (keysPressed.has("arrowup") || keysPressed.has("w")) {
      direction = "up";
    } else if (keysPressed.has("arrowdown") || keysPressed.has("s")) {
      direction = "down";
    } else if (keysPressed.has("arrowleft") || keysPressed.has("a")) {
      direction = "left";
    } else if (keysPressed.has("arrowright") || keysPressed.has("d")) {
      direction = "right";
    }

    if (direction) {
      sendMessage({ type: "move", id: user.id, direction });
      lastMoveTime = timestamp;
    }
  }

  requestAnimationFrame(gameLoop);
}

export function startGame() {
  if (gameLoopActive) return;
  gameLoopActive = true;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  requestAnimationFrame(gameLoop);
}

export function stopGame() {
  gameLoopActive = false;
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  keysPressed.clear();
}


export function renderStaticBoard(map) {
  const board = document.getElementById("game-board");
  board.innerHTML = "";
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (map.tiles[y][x] === "wall") cell.classList.add("wall");
      if (map.tiles[y][x] === "destructible-wall") cell.classList.add("destructible-wall");
      cell.dataset.row = y;
      cell.dataset.col = x;
      board.appendChild(cell);
    }
  }
}

export function renderPlayers(players, width) {
  players.forEach((p, i) => {
    if (!p.position || !p.alive) return;
    const index = p.position.y * width + p.position.x;
    const cell = document.querySelector(`#game-board .cell:nth-child(${index + 1})`);
    if (!cell) return;

    cell.classList.add("player", "player" + (i + 1));
    cell.dataset.playerClass = "player" + (i + 1);
    cell.dataset.playerId = p.id;
  });
}

export function showExplosion(explosion) {
  const board = document.getElementById("game-board");
  if (!board) return;

  // Use the tiles from the server's explosion data
  explosion.tiles.forEach(tile => {
    const { x, y } = tile;
    const cell = board.querySelector(`.cell[data-row="${y}"][data-col="${x}"]`);
    if (cell) {
      const explosionEl = document.createElement("div");
      explosionEl.className = `explosion explosion-${explosion.id}`;
      cell.appendChild(explosionEl);

      // If a destructible wall was there, remove its class
      if (cell.classList.contains("destructible-wall")) {
        cell.classList.remove("destructible-wall");
      }
    }
  });

  // Remove explosion visual after a short delay
  setTimeout(() => {
    board.querySelectorAll(`.explosion-${explosion.id}`).forEach(el => el.remove());
  }, 500); // Keep visible for 0.5 seconds
}

export function placeBomb(bomb) {
  const { position, id } = bomb;
  const { x, y } = position;
  const board = document.getElementById("game-board");
  if (!board) return;

  const cell = board.querySelector(`.cell[data-row="${y}"][data-col="${x}"]`);
  if (!cell) return;

  const bombEl = document.createElement("div");
  bombEl.className = `bomb bomb-${id}`;
  cell.appendChild(bombEl);
}

export function updatePlayer(player) {
  const { id, position, lives, alive } = player;
  const board = document.getElementById("game-board");
  const avatar = document.querySelector(`.player[data-player-id="${id}"]`);

  if (!avatar || !position) return;
  if (avatar.parentElement) {
    avatar.parentElement.classList.toggle("alive", alive);
    avatar.parentElement.classList.toggle("dead", !alive);
  }
  
}

export function leaveGame(id) {
  if (!id) return
    sendMessage({ type: "leaveGame", id });
    localStorage.removeItem("user");
    stopGame(); // Stop the loop and remove listeners
    window.location.hash = "/";
}

export function updatePlayerPosition(id, position) {
  const board = document.getElementById("game-board");
  if (!board) return;

  const cell = document.querySelector(`.cell.player[data-player-id="${id}"]`);
  if (!cell) return;
  const playerClass = cell.dataset.playerClass;
  if (!playerClass) return;
  const playerId = cell.dataset.playerId;
  if (!playerId) return;
  
  const newCell = board.querySelector(
    `.cell[data-row="${position.y}"][data-col="${position.x}"]`
  );
  if (!newCell) return;
  
  // Remove avatar from old cell

  cell.classList.remove('player', playerClass);
  delete cell.dataset.playerClass;
  delete cell.dataset.playerId;


  // Add avatar to new cell
  newCell.classList.add("player", playerClass);
  newCell.dataset.playerClass = playerClass;
  newCell.dataset.playerId = playerId;

}

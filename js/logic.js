import { sendMessage } from "./ws.js";

// Client-side state for smooth rendering
const clientPlayers = new Map();
const TILE_SIZE = 60; // The size of one tile in pixels

// game loop and input handling logic
let gameLoopActive = false;
const keysPressed = new Set();
let lastMoveTime = 0;
const MOVE_INTERVAL = 100; // move every 100ms
export let gameEnded = false;
export let gameFull = false;
export let gameStarted = false


function handleKeyDown(e) {
  // If the user is typing in the chat input, do not handle game controls.
  if (document.activeElement.id === 'chat-input') {
    return;
  }

  console.log("Key pressed:", e.key);
  // Prevent default browser actions for arrow keys
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
  ) {
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

// NEW: Rendering loop for smooth movement
function clientRenderLoop() {
  if (!gameLoopActive) return;

  const board = document.getElementById("game-board");
  if (!board) return;

  for (const [id, player] of clientPlayers.entries()) {
    if (!player.element) continue;

    // Interpolate position
    const now = Date.now();
    const timeSinceUpdate = now - player.lastUpdateTime;
    
    // Use player-specific speed for move duration. Must match server's baseCooldown.
    const baseCooldown = 200; 
    const moveDuration = baseCooldown / (player.speed || 1);

    // Clamp progress between 0 and 1
    const progress = Math.min(timeSinceUpdate / moveDuration, 1);

    // Linear interpolation (lerp)
    const visualX = player.lastPos.x + (player.targetPos.x - player.lastPos.x) * progress;
    const visualY = player.lastPos.y + (player.targetPos.y - player.lastPos.y) * progress;

    // Update CSS transform
    player.element.style.transform = `translate(${visualX * TILE_SIZE}px, ${visualY * TILE_SIZE}px)`;
  }

  requestAnimationFrame(clientRenderLoop);
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
  requestAnimationFrame(clientRenderLoop); // Start the rendering loop
}

export function stopGame() {
  gameLoopActive = false;
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  keysPressed.clear();
  clientPlayers.clear(); // Clear client-side player state
}

export function renderStaticBoard(map) {
  const board = document.getElementById("game-board");
  if (!board) return;
  if (board.innerHTML !== "") {
    board.innerHTML = "";
  }
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (map.tiles[y][x] === "wall") cell.classList.add("wall");
      if (map.tiles[y][x] === "destructible-wall")
        cell.classList.add("destructible-wall");
      cell.dataset.row = y;
      cell.dataset.col = x;
      board.appendChild(cell);
    }
  }
}

export function renderPlayers(players, width) {
  // This function now only creates the player elements once
  const board = document.getElementById("game-board");
  if (!board) return;

  players.forEach((p, i) => {
    if (!p.position || !p.alive) return;

    // Create element if it doesn't exist
    if (!clientPlayers.has(p.id)) {
      const avatarDiv = document.createElement("div");
      avatarDiv.classList.add("player", p.avatar);
      avatarDiv.dataset.playerId = p.id;
      board.appendChild(avatarDiv);

      // Initialize client-side state for this player
      clientPlayers.set(p.id, {
        element: avatarDiv,
        lastPos: { ...p.position },
        targetPos: { ...p.position },
        lastUpdateTime: Date.now(),
        speed: p.speed, // Store initial speed
      });

      // Set initial position
      avatarDiv.style.transform = `translate(${p.position.x * TILE_SIZE}px, ${p.position.y * TILE_SIZE}px)`;
    }
  });
}

export function showExplosion(explosion) {
  const board = document.getElementById("game-board");
  if (!board) return;

  // Use the tiles from the server's explosion data
  explosion.tiles.forEach((tile) => {
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
    board
      .querySelectorAll(`.explosion-${explosion.id}`)
      .forEach((el) => el.remove());
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
  const { id, alive } = player;

  const avatar = document.querySelector(`.player[data-player-id="${id}"]`);

  if (!avatar) return;

  // Update client-side state if it exists
  if (clientPlayers.has(id)) {
    const playerState = clientPlayers.get(id);
    // Update any provided stats
    if (player.speed !== undefined) {
      playerState.speed = player.speed;
    }
  }

  avatar.classList.toggle("dead", alive === false);
  
  if (alive === false) {
    avatar.remove();
    clientPlayers.delete(id);
  }
}

export function leaveGame(id) {
  if (!id) return;
  sendMessage({ type: "leaveGame", id });
  localStorage.removeItem("user");
  stopGame(); // Stop the loop and remove listeners
  window.location.hash = "/";
}

export function updatePlayerPosition(id, position) {
  // This function now updates the target for interpolation
  if (clientPlayers.has(id)) {
    const playerState = clientPlayers.get(id);
    
    // The old target becomes the new starting point for interpolation.
    playerState.lastPos = { ...playerState.targetPos };
    
    // The new position from the server is the new target.
    playerState.targetPos = { ...position };
    
    // Reset the timer for the new interpolation segment.
    playerState.lastUpdateTime = Date.now();
  }
}

// Add this function to render power-ups:

export function renderPowerUps(powerUps, width) {
  // Clear ALL existing power-ups first
  document.querySelectorAll(".power-up").forEach((el) => el.remove());

  if (!powerUps) return;

  powerUps.forEach((powerUp) => {
    const index = powerUp.y * width + powerUp.x;
    const cell = document.querySelector(
      `#game-board .cell:nth-child(${index + 1})`
    );
    if (!cell) return;

    const powerUpEl = document.createElement("div");
    powerUpEl.className = "power-up";
    powerUpEl.dataset.powerupId = powerUp.id;
    powerUpEl.dataset.powerupType = powerUp.type; // Add type for CSS

    // Set tooltip based on type
    if (powerUp.type === "bomb") {
      powerUpEl.title = "+1 Bomb";
    } else if (powerUp.type === "flame") {
      powerUpEl.title = "+1 Range";
    } else if (powerUp.type === "speed") {
      powerUpEl.title = "+50% Speed";
    }

    cell.appendChild(powerUpEl);
  });
}

export function updateMapTiles(map) {
  const board = document.getElementById("game-board");
  if (!board) return;

  // Update only the tile classes, don't clear the entire board
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = board.querySelector(
        `.cell[data-row="${y}"][data-col="${x}"]`
      );
      if (!cell) continue;

      // Reset tile classes
      cell.classList.remove("wall", "destructible-wall");

      // Apply new tile class
      if (map.tiles[y][x] === "wall") {
        cell.classList.add("wall");
      } else if (map.tiles[y][x] === "destructible-wall") {
        cell.classList.add("destructible-wall");
      }
    }
  }
}

// reset to start page by removing user from localStorage and redirecting to main page
// and updating gameStarted state
export function reset() {
    localStorage.removeItem('user');
    window.location.hash = '/';
    updateGameStarted(false);
}

export function updateGameStarted(status) {
  if (!status) return;
    gameStarted = status;
}

export function updateGameEnded(status) {
  if (!status) return;
    gameEnded = status;
}

export function updateEliminationMessage() {
      // create a div to show the message
    const container = document.getElementById("elimination-message");
    if (container) {
      if (gameEnded) {
        container.style.display = "none";
      } else {
        container.style.display = "block";
      }
    }
}
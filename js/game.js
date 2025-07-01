import { sendMessage } from "./ws.js";
import { Chat } from "./chat.js";
import { setState, getState, on } from "../framework/index.js";

window.setState = setState; //for testing purposes, remove later
window.getState = getState; //for testing purposes, remove later

setState({
  gameInfo: "",
  map: null,
  players: [],
  bombs: [],
  explosions: [],
  gameEnded: false,
});

// game loop and input handling logic
let gameLoopActive = false;
const keysPressed = new Set();
let lastMoveTime = 0;
const MOVE_INTERVAL = 100; // move every 100ms

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

function startGame() {
  if (gameLoopActive) return;
  gameLoopActive = true;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  requestAnimationFrame(gameLoop);
}

function stopGame() {
  gameLoopActive = false;
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  keysPressed.clear();
}

export function Game() {
  console.log("players in game:", getState().players);
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.hash = "/";
    return;
  }

  const nickname = user.nickname;
  const playerID = user.id;
  const { gameInfo, map, players, bombs, explosions, gameEnded } = getState();
  const me = (players || []).find(p => p.id === playerID);

  return {
    tag: "div",
    children: [
      {
        tag: "h2",
        children: ["Bomberman"],
      },
      {
        tag: "div",
        attrs: { id: "player-lives", style: "margin-bottom: 10px;" },
        children: (players || []).map(p => ({
          tag: "span",
          attrs: {
            key: p.id, // ensure each player has a unique key
            style: `margin-right: 16px; color: ${p.alive ? "black" : "gray"}; font-weight: bold;`
          },
          children: [
            `${p.nickname}: ${p.lives ?? 0} ❤️`
          ]
        }))
      },

      {
        tag: "div",
        attrs: { id: "game-board" },
        children: map ? renderGameBoard(map, players, bombs, explosions) : [],
      },
      // player is dead and there are other players alive
      (!gameEnded && me && me.lives === 0 && players.length > 2) && {
        tag: "div",
        attrs: {
          style: `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,255,255,0.7);
            border: 1px solid rgba(105, 103, 103, 0.5);
            padding: 32px;
            z-index: 1000;
            font-size: 2em;
            text-align: center;
          `
        },
        children: ["You have been beaten! You can still watch the fight and chat."]
      },
  
      gameEnded && {
        tag: "div",
        attrs: {
          key: "game-over-modal",
          style: `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(119, 30, 30, 0.9);
            border: 1px solid rgba(105, 103, 103, 0.5);
            padding: 32px;
            z-index: 1000;
            font-size: 2em;
            text-align: center;
          `
        },
        children: [
          `${gameInfo}`,
          { tag: "br" },
          { tag: "button", attrs: { onclick: () => window.location.hash = "/" }, children: ["Back to Menu"] }
        ]
      },
      {
        tag: "button",
        attrs: {
          onclick: () => {
            sendMessage({ type: "leaveGame", id: playerID });
            localStorage.removeItem("user");
            stopGame(); // Stop the loop and remove listeners
            window.location.hash = "/";
          },
        },
        children: ["Leave Game"],
      },
      {
        tag: 'div',
        attrs: {},
        children: [
          Chat({ playerID, nickname }) // Include Chat component
        ]
      },
    ].filter(Boolean), // Filter out any null values
  };
}

function renderGameBoard(map, players, bombs, explosions) {
  const cells = [];
  const rowLength = map.height || 13; // Default height
  const colLength = map.width || 15; // Default width

  for (let row = 0; row < rowLength; row++) {
    for (let col = 0; col < colLength; col++) {
      let cellClass = "cell";
      const cellType = map.tiles[row][col];
      
      if (cellType === "wall") {
        cellClass += " wall";
      } else if (cellType === "destructible-wall") {
        cellClass += " destructible-wall";
      }

      cells.push({
        tag: "div",
        attrs: {
          className: cellClass,
          "data-row": row,
          "data-col": col,
        },
        children: [],
      });
    }
  }

  if (players) {
    players.forEach((player, index) => {
      if (player.alive && player.position) {
        const { x, y } = player.position;
        const playerIndex = y * colLength + x;
        if (cells[playerIndex]) {
          cells[playerIndex].children.push({
            tag: 'div',
            attrs: {
              className: 'player',
              style: `background-image: url('../assets/player${index + 1}.png');`,
            },
            children: []
          });
        }
      }
    });
  }

  // Render bombs
  if (bombs) {
    bombs.forEach((bomb) => {
      const { x, y } = bomb.position;
      const bombIndex = y * colLength + x;
      if (cells[bombIndex]) {
        cells[bombIndex].children.push({
          tag: "div",
          attrs: { className: "bomb" },
          children: [],
        });
      }
    });
  }

  // Render explosions
  if (explosions) {
    explosions.forEach((explosion) => {
      explosion.tiles.forEach((tile) => {
        const { x, y } = tile;
        const explosionIndex = y * colLength + x;
        if (cells[explosionIndex]) {
          cells[explosionIndex].children.push({
            tag: "div",
            attrs: { className: "explosion" },
            children: [],
          });
        }
      });
    });
  }

  return cells;
}

// Handle game start message
on("gameStarted", ({ map, players, chatHistory }) => { // Add chatHistory parameter
  setState({ map, players });
  
  // Display lobby chat history in game chat
  if (chatHistory && chatHistory.length > 0) {
    setTimeout(() => { // Small delay to ensure DOM is rendered
      const chatContainer = document.getElementById('chat');
      if (chatContainer) {
        chatHistory.forEach(entry => {
          const div = document.createElement('div');
          div.textContent = `${entry.nickname}: ${entry.message}`;
          chatContainer.appendChild(div);
        });
      }
    }, 10);
  }
  
  startGame();
});

// Handle player movement updates from the server
on("playerMoved", ({ id, position }) => {
  const { players } = getState();
  // Find the player and update their position.
  // Create a new array to trigger re-render.
  const newPlayers = players.map((p) => {
    if (p.id === id) {
      return { ...p, position };
    }
    return p;
  });
  setState({ players: newPlayers });
});

// Handle bomb placement
on("bombPlaced", ({ bomb }) => {
  const { bombs } = getState();
  setState({ bombs: [...bombs, bomb] });
});

// Handle explosion
on("explosion", ({ bombId, explosion, updatedMap }) => {
  const { bombs, explosions } = getState();
  // Remove the exploded bomb by its ID
  const newBombs = bombs.filter((b) => b.id !== bombId);
  // Add the new explosion
  const newExplosions = [...explosions, explosion];
  setState({ bombs: newBombs, explosions: newExplosions, map: updatedMap });
});

// Handle explosion end
on("explosionEnded", ({ explosionId }) => {
  const { explosions } = getState();
  const newExplosions = explosions.filter((e) => e.id !== explosionId);
  setState({ explosions: newExplosions });
});

// Handle player updates (e.g., losing a life)
on("playerUpdate", ({ player }) => {
  if (player.lives <= 0 || player.alive === false) {
    return;
  }
  console.log("playerUpdate", player);
  const { players } = getState();
  const newPlayers = players.map((p) => {
    if (p.id === player.id && p.alive !== false) {
      return { ...p, ...player }; // Merge updates
    }
    return p;
  });
  setState({ players: newPlayers });
});






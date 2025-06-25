import { sendMessage } from "./ws.js";
import { Chat } from "./chat.js";
import { setState, getState, on } from "../framework/index.js";

// game loop and input handling logic
let gameLoopActive = false;
const keysPressed = new Set();
let lastMoveTime = 0;
const MOVE_INTERVAL = 100; // move every 100ms

function handleKeyDown(e) {
  // Prevent default browser actions for arrow keys
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
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
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.hash = "/";
    return;
  }

  const nickname = user.nickname;
  const playerID = user.id;
  const { gameInfo, map, players } = getState();

  return {
    tag: "div",
    children: [
      {
        tag: "h2",
        children: ["Bomberman"],
      },
      {
        tag: "div",
        attrs: { id: "game-board" },
        children: map ? renderGameBoard(map, players) : [],
      },
      {
        tag: "p",
        attrs: { id: "game-info" },
        children: [gameInfo || `Good luck, ${nickname}!`],
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
    ],
  };
}

function renderGameBoard(map, players) {
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
    players.forEach(player => {
      if (player.alive && player.position) {
        const { x, y } = player.position;
        const playerIndex = y * colLength + x;
        if (cells[playerIndex]) {
          cells[playerIndex].children.push({
            tag: 'div',
            attrs: {
              className: 'player'
            },
            children: []
          });
        }
      }
    });
  }

  return cells;
}

// Handle game start message
on("gameStarted", ({ map, players }) => {
  setState({ map, players });
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

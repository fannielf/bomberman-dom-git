import { WebSocketServer, WebSocket } from "ws";
import { addPlayer, gameState, players } from "./game/state.js";

const server = new WebSocketServer({ port: 8080 });
const clients = new Map();
let countdownInterval = null; // Add global countdown tracker
let resetTimeout = null; // Add this variable at the top with your other globals

// Broadcasts a message to all connected clients, except the one specified in 'exclude'
function broadcast(data, exclude = null) {
  for (let [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

// Generate map function
function generateGameMap() {
  const rows = 13;
  const cols = 15;
  const map = [];

  for (let row = 0; row < rows; row++) {
    map[row] = [];
    for (let col = 0; col < cols; col++) {
      if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        map[row][col] = "wall";
      } else if (row % 2 === 0 && col % 2 === 0) {
        map[row][col] = "wall";
      } else if (Math.random() < 0.3) {
        map[row][col] = "destructible-wall";
      } else {
        map[row][col] = "empty";
      }
    }
  }
  return map;
}

server.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
      console.log("Parsed data:", data); // Log parsed data
    } catch {
      broadcast({ type: "error", message: "Invalid JSON format" });
      return;
    }

    switch (data.type) {
      case "join":
        if (clients.has(ws)) return;

        if (clients.size >= 4) {
          ws.send(JSON.stringify({ type: "error", message: "Game is full" }));
          return;
        }

        for (let client of clients.values()) {
          if (client.nickname.toLowerCase() === data.nickname.toLowerCase()) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Nickname already taken",
              })
            );
            return;
          }
        }

        const id = crypto.randomUUID();
        clients.set(ws, {
          id,
          nickname: data.nickname,
          page: data.page || "lobby",
        });
        broadcast({ type: "playerJoined", id, nickname: data.nickname });
        broadcast({
          type: "playerCount",
          count: clients.size,
          players: Array.from(clients.values()).map((c) => c.nickname),
          gameFull: clients.size >= 4,
        });

        // Only handle countdown logic for lobby connections
        if (data.page === "lobby") {
          if (gameState.status === "waiting" && clients.size >= 2) {
            startCountdown();
          } else if (gameState.status === "countdown") {
            ws.send(
              JSON.stringify({
                type: "countdown",
                countdown: gameState.countdown,
              })
            );
          }
        }
        // For game page connections, immediately send map if available
        else if (data.page === "game") {
          if (
            gameState.status === "running" &&
            gameState.map.tiles.length > 0
          ) {
            ws.send(
              JSON.stringify({ type: "startGame", map: gameState.map.tiles })
            );
          }
        }
        break;

      case "chat":
        broadcast({
          type: "chat",
          nickname: clients.get(ws).nickname,
          message: data.message,
        });
        break;

      case "startGame":
        if (clients.size < 2) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Not enough players to start the game",
            })
          );
          return;
        }
        broadcast({ type: "startGame" });
        break;

      case "gameUpdate":
        broadcast({ type: "gameUpdate", state: data.state }, ws);
        break;

      default:
        ws.send(
          JSON.stringify({ type: "error", message: "Unknown message type" })
        );
        return;
    }
  });

  ws.on("close", () => {
    clients.delete(ws);

    // Add a delay before resetting game state when all players leave
    if (clients.size === 0) {
      // Clear any existing timeout
      if (resetTimeout) {
        clearTimeout(resetTimeout);
      }

      // Set a new timeout - wait 3 seconds before resetting
      resetTimeout = setTimeout(() => {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }

        gameState.status = "waiting";
        gameState.countdown = 0;
        gameState.map.tiles = [];
        players.clear();

        resetTimeout = null;
      }, 3000);
    } else {
      // If there are still clients, clear the reset timeout
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        resetTimeout = null;
      }
    }

    broadcast({
      type: "playerCount",
      count: clients.size,
      players: Array.from(clients.values()).map((c) => c.nickname),
    });
  });
});

function startCountdown() {
  // Prevent multiple countdowns
  if (gameState.status !== "waiting" || countdownInterval !== null) {
    return;
  }

  gameState.status = "countdown";
  gameState.countdown = 10;
  gameState.map.tiles = generateGameMap();

  for (let [ws, client] of clients) {
    if (ws.readyState !== WebSocket.OPEN) {
      clients.delete(ws);
      continue;
    }
    addPlayer(client);
  }

  countdownInterval = setInterval(() => {
    if (gameState.countdown > 0) {
      gameState.countdown--;
      broadcast({ type: "countdown", countdown: gameState.countdown });
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null; // Reset tracker
      gameState.status = "running";
      broadcast({ type: "startGame", map: gameState.map.tiles });
    }
  }, 1000);
}

import { WebSocketServer, WebSocket } from 'ws'; // Import server and connection classes from 'ws' package
import { addPlayer } from './game/state.js';
import { startGameLoop } from './gameloop.js';
import { gameState } from './game/state.js';
import { setState } from '../framework/index.js';
import { getState } from '../framework/index.js'; // Make sure this is imported


setState(gameState); // Initialize game state in the framework

const server = new WebSocketServer({ port: 8080 }); // Create a WebSocket server on port 8080
console.log('WebSocket server is running on ws://localhost:8080'); // Log server start
const clients = new Map(); // ws -> { id, nickname }

// Broadcasts a message to all connected clients, except the one specified in 'exclude'
function broadcast(data, exclude = null) {
  for (let [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

// Handle incoming WebSocket connections
server.on('connection', ws => {
  console.log('New client connected'); // Log when a new client connects
  ws.on('message', msg => {
    console.log('Received message:', msg);
    let data;
    try {
      data = JSON.parse(msg); // Parse incoming message as JSON
      console.log('Parsed data:', data); // Log parsed data
    } catch {
      broadcast({ type: 'error', message: 'Invalid JSON format' }); // Handle JSON parsing errors
      return;
    }

    // Handle message types
    switch (data.type) {
      case 'join': // Join a game with a nickname
        if (clients.has(ws)) return; // Prevent re-joining

        if (clients.size >= 4) { // Limit to 4 players
          ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
          return;
        } else {
          for (let client of clients.values()) { // Check for duplicate nicknames
            if (client.nickname.toLowerCase() === data.nickname.toLowerCase()) {
              ws.send(JSON.stringify({ type: 'error', message: 'Nickname already taken' }));
              return;
            }
          }
          const id = crypto.randomUUID();
          clients.set(ws, { id, nickname: data.nickname }); // Store nickname and connection
          broadcast({ type: 'playerJoined', id, nickname: data.nickname });
          broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname), gameFull: clients.size >= 4 });
          // if game is full, start countdown
          if (clients.size === 4) {
            startCountdown();
          }
          break;
        }

      case 'chat': // Handle chat messages
        broadcast({ type: 'chat', nickname: clients.get(ws).nickname, message: data.message });
        break;

      case 'startGame': // Start the game if enough players are connected
        if (clients.size < 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not enough players to start the game' }));
          return;
        }
        broadcast({ type: 'startGame' });
        console.log('Game started with players:', Array.from(clients.values()).map(c => c.nickname));
        break;

      case 'gameUpdate': // Handle game state updates
        broadcast({ type: 'gameUpdate', state: data.state }, ws); // Don't send to sender??
        break;

      default: // Handle unknown message types
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        return;
    }
  });

  // Delete connection when client disconnects
  ws.on('close', () => {
    clients.delete(ws);
    broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname) });
  });
});

// startCountdown function to initiate the game countdown and add players to the game state
// ...existing code...
function startCountdown() {
  gameState.status = 'countdown';
  gameState.countdown = 10;
  broadcast({ type: 'gameStateUpdate', state: gameState });
  for (let [ws, client] of clients) {
    if (ws.readyState !== WebSocket.OPEN) {
      clients.delete(ws);
      continue;
    }
    addPlayer(client);
  }
  const countdownInterval = setInterval(() => {
    if (gameState.countdown > 0) {
      gameState.countdown--;
      broadcast({ type: 'countdown', countdown: gameState.countdown });
    } else {
      clearInterval(countdownInterval);
      gameState.status = 'running';
      broadcast({ type: 'startGame' });

      // Start the game loop and broadcast state on each tick
      startGameLoop();
      import('../framework/events.js').then(({ on }) => {
        on('tick', () => {
          const state = getState();
          console.log('Broadcasting gameUpdate:', state); // Add this line
          broadcast({ type: 'gameUpdate', state });
        });
      });
    }
  }, 1000);
}
import { WebSocketServer, WebSocket } from 'ws'; // Import server and connection classes from 'ws' package
import { addPlayer } from './game/state.js';

const server = new WebSocketServer({ port: 8080 }); // Create a WebSocket server on port 8080

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
function startCountdown() {
  gameState.status = 'countdown';
  gameState.countdown = 10; // Set countdown to 10 seconds
  broadcast({ type: 'gameStateUpdate', state: gameState });
  for (let [ws, client] of clients) {
    // if connection is open, add player to the game state
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
      // Initialize game state here if needed
    }
  }, 1000);

}
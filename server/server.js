import { WebSocketServer } from 'ws';

const server = new WebSocketServer({ port: 8080 }); // Create a WebSocket server on port 8080

const clients = new Map(); // ws -> { nickname }

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
  console.log('New connection');
  ws.on('message', msg => {
    console.log('Received message:', msg);
    let data;
    try {
      data = JSON.parse(msg); // Parse incoming message as JSON
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
          clients.set(ws, { nickname: data.nickname }); // Store nickname and connection
          broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname), gameFull: clients.size >= 4 });
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

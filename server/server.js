import { WebSocketServer, WebSocket } from 'ws'; // Import server and connection classes from 'ws' package
import { addPlayer, startCountdown } from './game/state.js';

const server = new WebSocketServer({ port: 8080 });

const clients = new Map(); // id -> { ws, nickname }

// Broadcasts a message to all connected clients, except the one specified in 'exclude'
export function broadcast(data, exclude=null) {

  for (const { ws } of clients.values()) {
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
    try { data = JSON.parse(msg) } catch {
      ws.send(JSON.stringify({ type:'error', message:'Invalid JSON' }));
      return;
    }

    let id = data.id ?? null;

    // only validate id for messages after join
    if (data.type !== 'join' && data.type !== 'ping') {
      if (id === null) {
        ws.send(JSON.stringify({ type:'error', message:'Missing playerID' }));
        return;
      }
      if (!clients.has(id)) {
        ws.send(JSON.stringify({ type:'error', message:'Client not found by id' }));
        return;
      }
    }

    // Handle message types
    switch (data.type) {
      case 'join': // Join a game with a nickname
        if (clients.has(id)) return; // Prevent re-joining

        if (clients.size >= 4) { // Limit to 4 players
          ws.send(JSON.stringify({ type: 'error', message: 'Game is full', gameFull: clients.size >= 4 }));
          return;

        } else {
          if (data.nickname === null) {
            ws.send(JSON.stringify({type: 'error', message: 'Nickname missing'}))
            return
          }
          for (let client of clients.values()) { // Check for duplicate nicknames
            if (client.nickname.toLowerCase() === data.nickname.toLowerCase()) {
              ws.send(JSON.stringify({ type: 'error', message: 'Nickname already taken' }));
              return;
            }
          }
          id = crypto.randomUUID(); // create unique ID
          clients.set(id, { ws, nickname:data.nickname }); // Store id, nickname and connection
          console.log('Client nickname:', clients.get(id).nickname); // Log the nickname of the client
          ws.send(JSON.stringify({ type: 'playerJoined', id: id, nickname: clients.get(id).nickname })); // Notify client of successful join
          // if game is full, start countdown
          if (clients.size === 4) {
            startCountdown();
            addPlayer();
          }
          break;
        }

      case 'chat': // Handle chat messages
        broadcast({ type: 'chat', nickname: clients.get(id).nickname, message: data.message });
        break;

      case 'startGame': // Start the game if enough players are connected
        if (clients.size < 2) {
          broadcast({ type: 'error', message: 'Not enough players to start the game' });
          return;
        }
        broadcast({ type: 'startGame' }, ws, true);
        break;

      case 'gameUpdate': // Handle game state updates
        broadcast({ type: 'gameUpdate', state: data.state }); // Don't send to sender??
        break;
      case 'lobby':
        broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname), gameFull: clients.size >= 4 });
        break;
      case 'pageReload': // update connection when pages are reloaded
        if (clients.has(id)) {
          updateConnection(id, ws)
          ws.send(JSON.stringify({ type: 'reconnected', id, nickname: clients.get(id).nickname }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Client not found by id' }));
        }
        break;
      case 'ping':
        console.log("ping")
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

// update the user connection
function updateConnection(id, conn) {
    clients.get(id).ws = conn; // Update WebSocket connection for the client
}
import { WebSocketServer, WebSocket } from 'ws'; // Import server and connection classes from 'ws' package
import { addPlayer, startCountdown } from './game/state.js';

const server = new WebSocketServer({ port: 8080 });

const clients = new Map(); // id -> { ws, nickname }
let waitTimer = null;
let firstJoinTime = null;

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
    try {
      data = JSON.parse(msg); // Parse incoming message as JSON
      console.log('Parsed data:', data); // Log parsed data
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON format' })); // Handle JSON parsing errors
      return;
    }

    let id = data.id || null;

    if (data.type !== 'join' && data.type !== 'ping' && id === null) { // Check if id is provided for non-join messages
      ws.send(JSON.stringify({ type: 'error', message: 'Missing playerID' }));
      return;
    } else if (!clients.has(id) && data.type !== 'join' ) { // Check if client exists
      ws.send(JSON.stringify({ type: 'error', message: 'Client not found by id' }));
      return;
    }

    // Handle message types
    switch (data.type) {
      case 'join': // Join a game with a nickname
        handleJoin(id, ws, data);
        break;

      case 'chat': // Handle chat messages
        broadcast({ type: 'chat', nickname: clients.get(id).nickname, message: data.message });
        break;

      case 'gameUpdate': // Handle game state updates
        broadcast({ type: 'gameUpdate', state: data.state }); // Don't send to sender??
        break;

      case 'lobby':
      sendLobbyUpdate();
      break;

      case 'pageReload': // update connection when pages are reloaded
        if (clients.has(id)) {
          updateConnection(id, ws)
          ws.send(JSON.stringify({ type: 'reconnected', id, nickname: clients.get(id).nickname }));
          sendLobbyUpdate(); // Send updated player count and list
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

function sendLobbyUpdate() {
  broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname), gameFull: clients.size >= 4 });
}

function handleJoin(id, ws, data) {
  console.log("Handle join triggered:", data)
  if (clients.has(id)) { // Prevent re-joining
      ws.send(JSON.stringify({ type: 'playerExists', id: id, nickname: clients.get(id).nickname })); // Notify client of successful join
      return;
    }; 

  if (clients.size >= 4) { // Limit to 4 players
    ws.send(JSON.stringify({ type: 'error', message: 'Game is full', gameFull: clients.size >= 4 }));
    return;

  } else {
    const error = validateNickname(data); // Validate nickname
    if (error) {
      ws.send(JSON.stringify(error)); // Send error if nickname is invalid
      return;
    }

    id = crypto.randomUUID(); // create unique ID
    clients.set(id, { ws, nickname: data.nickname.trim() }); // Store id, connection andn nickname
    ws.send(JSON.stringify({ type: 'playerJoined', id: id, nickname: clients.get(id).nickname })); // Notify client of successful join
    // if game is full, start countdown
    if (clients.size === 4) {
      startCountdown();
      addPlayer();
    }
  }
}

function validateNickname(data) {
  if (!data.nickname || data.nickname.trim() === '') {
    return { type: 'error', message: 'Nickname missing' };
  }

  const nickname = data.nickname.trim().toLowerCase();

  for (let client of clients.values()) {
    if (client.nickname.toLowerCase() === nickname) {
      return { type: 'error', message: 'Nickname already taken' };
    }
  }

  return null; // valid
}

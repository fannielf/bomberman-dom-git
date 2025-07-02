import { WebSocketServer } from 'ws'; // Import server from 'ws' package
import { deActivePlayer, handlePlayerMove, handlePlaceBomb, startGame, players } from './game/state.js';
import { clients, broadcast, sendMsg, updateConnection } from './handlers/connection.js'; // Import the clients map to manage connections
import { handleJoin, readyTimer } from './handlers/main.js';
import { sendLobbyUpdate } from './handlers/lobby.js'; // Import the lobby update function
import { handleNewChat } from './handlers/chat.js'; // Import chat handling function
import { sendGameUpdate } from './handlers/game.js'; // Import game update function

const server = new WebSocketServer({ port: 8080 });
let count = 0;

// Handle incoming WebSocket connections
server.on('connection', ws => {

  ws.on('message', msg => {

    let data;
    try { 
      data = JSON.parse(msg)
    } catch {
      sendMsg(ws, 'error', { message: 'Invalid JSON' });
      return;
    }

    let id = data.id ?? null;
    console.log('Received message:', data);

    if (data.type !== 'join' && data.type !== 'gameStart' && id === null) { // Check if id is provided for non-join messages
      sendMsg(ws, 'error', { message: 'Missing playerID' });
      return;
    } else if (!clients.has(id) && data.type !== 'join' && data.type !== 'gameStart') { // Check if client exists
      sendMsg(ws, 'error', { message: 'Client not found by id' });
      return;
    }

    // Handle message types
    switch (data.type) {
      case 'join': // Join a game with a nickname
        handleJoin(id, ws, data);
        readyTimer(); // Start the ready timer if needed
        break;

      case 'lobby':
        sendLobbyUpdate();
        break;

      case 'chat': // Handle chat messages
        handleNewChat(id, data)
        break;
      
      case 'gameStart':
      count++; // Increment the count of gameStart messages
      if (count === players.size) { // Check if all players are ready
        // count gameStart messages and when all ready, broadcast game start
        startGame(); // Start the game if all players are ready
      }
        break;

      case 'move':
        handlePlayerMove(id, data.direction);
        break;

      case 'placeBomb':
        handlePlaceBomb(id);
        break;

      case 'gameUpdate': // Handle game state updates
        // Need to update the game state on server side
        broadcast({ type: 'gameUpdate', state: data.state });
        break;

      case 'pageReload': // update connection when pages are reloaded
        if (clients.has(id)) {
          updateConnection(id, ws)
          //sendMsg(ws, 'reconnected', { id, nickname: clients.get(id).nickname });
          if (data.page === '/lobby') {
            sendLobbyUpdate(ws); // Send updated player count and list
          } else if (data.page === '/game') {
            startGame(ws); // Send game state to the client
          }
        } else {
          sendMsg(ws, 'error', { message: 'Client not found by id' });
        }
        break;

      case 'leaveGame':
        deActivePlayer(id); // Deactivate player
        clients.delete(id); // Remove client from the map

      default: // Handle unknown message types
        sendMsg(ws, 'error', { message: 'Unknown message type' });
        return;
    }
  });

  // Delete connection when client disconnects
  ws.on('close', () => {
    clients.delete(ws);
    broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname) });
  });

});


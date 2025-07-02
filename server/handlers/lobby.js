import { chatHistory } from './chat.js';
import { clients, broadcast } from './connection.js'; // Import the clients map to manage connections
import { gameState, resetGameState } from '../game/state.js';


export function sendLobbyUpdate() {
  if ((gameState.status === "ended" || gameState.status === "waiting") && clients.size === 1) {
    resetGameState(); 
    console.log("Resetting game state for a new game");
  }

  broadcast({
    type: 'updatePlayerCount',
    count: clients.size,
    players: Array.from(clients.values()).map(c => c.nickname),
    gameFull: clients.size >= 4,
    chatHistory
  });
}
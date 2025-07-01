import { chatHistory } from './chat.js';
import { clients, broadcast } from './connection.js'; // Import the clients map to manage connections

export function sendLobbyUpdate() {
  broadcast({ type: 'playerCount', count: clients.size, players: Array.from(clients.values()).map(c => c.nickname), gameFull: clients.size >= 4, chatHistory });
}
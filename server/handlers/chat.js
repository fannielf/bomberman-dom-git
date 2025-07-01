import { broadcast, clients } from "./connection.js"; 

export let chatHistory = [];


export function handleNewChat(id, data) {
  if (!data.message || data.message.trim() === '') {
    return; // Ignore empty messages
  }

  const nickname = clients.get(id)?.nickname || 'Unknown';
  const message = data.message.trim();

  // Add the new chat message to the history
  chatHistory.push({ nickname, message });

  // Limit chat history to the last 100 messages
  if (chatHistory.length > 100) {
    chatHistory.shift(); // Remove the oldest message
  }

  // Broadcast the new chat message to all clients
  broadcast({ type: 'chat', nickname, message });

}
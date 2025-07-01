import { WebSocket } from "ws"; //Import connection classes from 'ws' package

export const clients = new Map(); // id -> { ws, nickname }

// Broadcasts a message to all connected clients, except the one specified in 'exclude'
export function broadcast(data, exclude=null) {

  for (const { ws } of clients.values()) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

}

// update the user connection
export function updateConnection(id, conn) {
    clients.get(id).ws = conn; // Update WebSocket connection for the client
}


export function sendMsg(ws, type, message = {}) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...message }));
    }
}
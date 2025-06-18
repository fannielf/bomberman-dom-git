import { WebSocketServer } from 'ws';

const server = new WebSocketServer({ port: 8080 });

const clients = new Map(); // ws -> { nickname }

function broadcast(data, exclude = null) {
  for (let [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }
}

server.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    // Handle message types
    switch (data.type) {
      case 'join':
        clients.set(ws, { nickname: data.nickname });
        broadcast({ type: 'playerCount', count: clients.size });
        break;

      case 'chat':
        broadcast({ type: 'chat', nickname: clients.get(ws).nickname, message: data.message });
        break;

      case 'startGame':
        broadcast({ type: 'startGame' });
        break;

      case 'gameUpdate':
        broadcast({ type: 'gameUpdate', state: data.state }, ws); // Don't send to sender
        break;
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcast({ type: 'playerCount', count: clients.size });
  });
});

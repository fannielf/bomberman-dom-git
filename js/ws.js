import {emit}  from '../framework/index.js';

let socket;
export let error = null;
export let gameFull = false;

function connect() {
    socket = new WebSocket('ws://localhost:8080/ws');

    socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
    });

    // Listen for messages from the server
    socket.addEventListener('message', (event) => {

    const msg = JSON.parse(event.data);
    console.log("message received:", msg)
    switch (msg.type) {
    case 'readyTimer': // Add this case
        emit('readyTimer', { countdown: msg.countdown });
        break;
    case 'playerExists':
        // If player already exists, redirect to lobby
        window.location.hash = '/lobby'; // Redirect to lobby page
        emit('playerJoined', { id: msg.id, nickname: msg.nickname });
    case 'chat':
        if (window.location.hash === '/') return;
        emit('newChat', {nickname: msg.nickname, message: msg.message});
        break;
    case 'error':
        if (msg.message === 'Client not found by id') {
            localStorage.removeItem('user'); // Remove user from local storage if client not found
            window.location.hash = '/'; // Redirect to index page
        } // Ignore this error
        emit('showError', msg.message);
        break;
    case 'playerCount':
        // update player count and list
        emit('updatePlayerCount', {count: msg.count, players: msg.players, gameFull: msg.gameFull, chatHistory: msg.chatHistory});
        break;
    case 'playerJoined':
        emit('playerJoined', { id: msg.id, nickname: msg.nickname });
        break;
    case 'reconnected':
    case 'lobbyReset':
        localStorage.removeItem('user'); // Remove user from local storage
        window.location.hash = '/'; // Redirect to index page
        break;
    case 'gameStarted':
        emit('gameStarted', { map: msg.map, players: msg.players, chatHistory: msg.chatHistory });
        window.location.hash = '/game';
        break;
    case 'playerMoved':
        emit('playerMoved', { id: msg.id, position: msg.position });
        break;
    case 'bombPlaced':
        emit('bombPlaced', { bomb: msg.bomb });
        break;
    case 'explosion':
        emit('explosion', { bombId: msg.bombId, explosion: msg.explosion, updatedMap: msg.updatedMap });
        break;
    case 'explosionEnded':
        emit('explosionEnded', { explosionId: msg.explosionId });
        break;
    case 'playerUpdate':
        emit('playerUpdate', { player: msg.player });
        break;
    case 'deActivePlayer':
        emit('deActivePlayer', { id: msg.id, nickname: msg.nickname });
        break;
    case 'gameEnded':
        emit('gameEnded', { winner: msg.winner });
        break;
    }
        
    })

}
connect();

export function sendMessage(message) {
    if (message.type === null || message.type === undefined) return;
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify(message));
    }, { once: true });
  }
}

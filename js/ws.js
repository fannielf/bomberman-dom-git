import {emit, once}  from '../framework/index.js';

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
    case 'gameState':
        // setState({ page: '/game' });
        window.location.hash = '/game'; // Redirect to game page
        sendMessage({ type: 'gameStart'});
        break;
    case 'playerExists':
        // If player already exists, redirect to lobby
        window.location.hash = '/lobby'; // Redirect to lobby page
        // setState({ page: '/lobby' });
        emit('playerJoined', { id: msg.id, nickname: msg.nickname });
        break;
    case 'chat':
        console.log("chat message received:", msg);
        if (window.location.hash === '/') return;
        emit('newChat', {nickname: msg.nickname, message: msg.message});
        break;
    case 'error':
        if (msg.message === 'Client not found by id') {
            reset();
        }
        emit('showError', msg.message);
        break;
    case 'playerCount':
        console.log("player count message received:", msg);
        emit('updatePlayerCount', {count: msg.count, players: msg.players, gameFull: msg.gameFull, chatHistory: msg.chatHistory});
        break;
    case 'playerJoined':
        console.log("player joined message received:", msg);
        emit('playerJoined', { id: msg.id, nickname: msg.nickname });
        break;
    // case 'lobbyReset':
    //     console.log("lobby reset message received:", msg);
    //     reset();
    //     break;
    case 'gameStarted':
        console.log("game started message received:", msg);
        emit('gameStarted', { map: msg.map, players: msg.players, chatHistory: msg.chatHistory });
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
    case 'playerUpdate':
        emit('playerUpdate', { player: msg.player });
        break;
    case 'playerEliminated':
        emit('playerEliminated', { id: msg.id, nickname: msg.nickname });
        break;
    case 'gameUpdate':
        emit('gameUpdate', {gameState: msg.gameState, players: msg.players, chatHistory: msg.chatHistory });
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

// resest to start page
function reset() {
    localStorage.removeItem('user'); // Remove user from local storage
    // setState({ page: '/' });
    window.location.hash = '/'; // Redirect to start page
}
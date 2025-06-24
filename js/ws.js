import {emit}  from '../framework/index.js';

let socket;

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
    case 'chat':
        if (window.location.hash === '/') return;
        console.log("chat message received:", msg.nickname, msg.message)
        emit('newChat', {nickname: msg.nickname, message: msg.message});
        break;
    case 'startGame':
        window.location = 'game.html';
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
        emit('updatePlayerCount', {count: msg.count, players: msg.players, gameFull: msg.gameFull});
        break;
    case 'playerJoined':
        console.log("playerJoined message received:", msg.nickname)
        emit('playerJoined', { id: msg.id, nickname: msg.nickname });
        break;
    case 'reconnected':
        console.log("reconnected message received:", msg.nickname)
    case 'lobbyReset':
        localStorage.removeItem('user'); // Remove user from local storage
        window.location.hash = '/'; // Redirect to index page
        break;
    }
        
    })

//     setInterval(() => {
//     if (socket.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify({ type: 'ping' }));
//     }
// }, 20000); // every 20 seconds

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
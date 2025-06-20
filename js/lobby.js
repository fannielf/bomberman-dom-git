const nickname = localStorage.getItem('nickname');
if (!nickname) {
  window.location = 'index.html';
}
// start the ws for the lobby page
const socket = new WebSocket('ws://localhost:8080');

// sending the nickname to the server after lobby page load 
socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'join', nickname, page: 'lobby' }));
};

// listen for messages from the server: 'playerCount', 'startGame', 'chat', 'error'
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'playerCount') {
    document.getElementById('players').textContent = `Players in lobby: ${msg.count}/4`;
  }
  
  if (msg.type === 'countdown') {
    document.getElementById('timer').textContent = `Game starts in: ${msg.countdown}s`;
  }
  
  if (msg.type === 'startGame') {
    window.location = 'game.html';
  }
  
  if (msg.type === 'chat') {
    const chatDiv = document.getElementById('chat');
    chatDiv.innerHTML += `<div><b>${msg.nickname}:</b> ${msg.message}</div>`;
  }
  
  if (msg.type === 'error') {
    document.getElementById('lobby-error').textContent = msg.message;
  }
};

document.getElementById('welcome').textContent = `Welcome, ${nickname}!`;

document.getElementById('send-chat').onclick = function() {
  const message = document.getElementById('chat-input').value.trim();
  if (message) {
    socket.send(JSON.stringify({ type: 'chat', nickname, message }));
    document.getElementById('chat-input').value = '';
  }
};
const nickname = localStorage.getItem('nickname');
if (!nickname) {
  window.location = 'index.html';
}
// start the ws for the lobby page
const socket = new WebSocket('ws://localhost:8080');

let countdownStarted = false;
let timer = 10;
let timerInterval = null;

// sending the nickname to the server again after lobby page load 
socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'join', nickname }));
};

//listen for messages from the server: 'playerCount', 'startGame', 'chat', 'error'
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'playerCount') {
    document.getElementById('players').textContent = `Players in lobby: ${msg.count}/4`;

    // If there are 2 or more players, start countdown
    if (msg.count >= 2 && !countdownStarted) {
      countdownStarted = true;
      timer = 10;
      document.getElementById('timer').textContent = `Game starts in: ${timer}s`;
      timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').textContent = `Game starts in: ${timer}s`;
        if (timer <= 0) {
          clearInterval(timerInterval);
          document.getElementById('timer').textContent = 'Game starting!';
          // if server is ready, redirect to game page
          // or for testing purposes, window.location = 'game.html'

        }
      }, 1000);
    }
    // If the player count drops below 2, stop the countdown
    if (msg.count < 2 && countdownStarted) {
      countdownStarted = false;
      clearInterval(timerInterval);
      document.getElementById('timer').textContent = '';
    }
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
const socket = new WebSocket('ws://localhost:8080');

document.getElementById('join-btn').onclick = function() {
  const nickname = document.getElementById('nickname-input').value.trim();
  if (!nickname) {
    document.getElementById('error').textContent = 'Please enter a nickname';
    return;
  }
 
  localStorage.setItem('nickname', nickname);
  socket.send(JSON.stringify({ type: 'join', nickname }));
};

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'error') {
    document.getElementById('error').textContent = msg.message;
  }
  if (msg.type === 'playerCount') {
    const nickname = localStorage.getItem('nickname');
    if (msg.players && msg.players.includes(nickname)) {
      console.log('Player added to lobby:', nickname);
      window.location = 'lobby.html';
    }
  } if (msg.type === 'playerJoined') {
    window.location = 'lobby.html';
  }
};
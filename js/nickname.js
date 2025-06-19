const socket = new WebSocket('ws://localhost:8080');

// Handle nickname submission
document.getElementById('join-btn').onclick = function() {
  const nickname = document.getElementById('nickname-input').value.trim();
  if (!nickname) {
    document.getElementById('error').textContent = 'Please enter a nickname';
    return;
  }
 
  socket.send(JSON.stringify({ type: 'join', nickname }));
};

// Listen for messages from the server
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'error') {
    document.getElementById('error').textContent = msg.message;
  }
  if (msg.type === 'playerCount') { // server sends player count and list
    // update player count and list
    document.getElementById('player-count').textContent = `Players: ${msg.count}`;
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = ''; // Clear previous list
    msg.players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player;
      playerList.appendChild(li);
    });
    if (msg.gameFull) {
      document.getElementById('join-btn').disabled = true;
      document.getElementById('error').textContent = 'Game is full, waiting for start...';
    }
  } if (msg.type === 'playerJoined') { // server confirms that player connection is successful
    localStorage.setItem('playerId', msg.id);
    localStorage.setItem('nickname', msg.nickname);
    window.location = 'lobby.html';
  }
};
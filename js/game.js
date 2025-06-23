const nickname = localStorage.getItem('nickname');
if (!nickname) {
    window.location = 'index.html';
} else {
    const socket = new WebSocket('ws://localhost:8080');
    document.getElementById('game-info').textContent = `Good luck, ${nickname}!`;


// sending the nickname to the server again after game page load 
socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join', nickname }));
};

//adding the chat messages to the DOM
socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'chat') {
      const chatDiv = document.getElementById('chat');
      const div = document.createElement('div');
      div.innerHTML = `<b>${msg.nickname}:</b> ${msg.message}`;
      chatDiv.appendChild(div);
    }
    if (msg.type === 'gameUpdate') {
      renderGameState(msg.state);
    }
  };


function renderGameState(state) {
    console.log('Rendering state:', state); // Add this line
  const board = document.getElementById('game-board');
  if (!state || !state.map || !state.map.tiles) {
    board.textContent = 'Waiting for game state...';
    return;
  }

  // Build a 2D array for quick lookup of player positions
  const playerPositions = {};
  for (const [id, player] of Object.entries(state.players)) {
    if (player.alive && player.position) {
      playerPositions[`${player.position.x},${player.position.y}`] = player.nickname[0].toUpperCase(); // Use first letter of nickname
    }
  }

  // Render the board with players
  board.innerHTML = '';
  for (let y = 0; y < state.map.height; y++) {
    let row = '';
    for (let x = 0; x < state.map.width; x++) {
      const key = `${x},${y}`;
      if (playerPositions[key]) {
        row += `<span style="color:blue;font-weight:bold">${playerPositions[key]}</span>`;
      } else {
        const tile = state.map.tiles[y]?.[x] || ' ';
        if (tile === 'empty') row += '.';
        else if (tile === 'wall') row += '#';
        else if (tile === 'block') row += '%';
        else row += tile[0].toUpperCase();
      }
    }
    board.innerHTML += `<div style="font-family:monospace">${row}</div>`;
  }
}

  //adding the functionality to the send chat button
document.getElementById('send-chat').onclick = function() {
    const message = document.getElementById('chat-input').value.trim();
    if (message) {
      socket.send(JSON.stringify({ type: 'chat', nickname, message }));
      document.getElementById('chat-input').value = ''; //clear input field after sending
    }
  };

  //when wanting to leave the game, redirect to index.html
  document.getElementById('leave-game').onclick = function() {
    window.location = 'index.html';
  };
}
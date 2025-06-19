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
  };

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
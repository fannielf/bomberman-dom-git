import { sendMessage } from "./ws";

const user = JSON.parse(localStorage.getItem('user'));

const nickname = user.nickname;
const playerID = user.id;

if (!nickname && !playerID) {
    window.location = 'index.html';
} else {
    document.getElementById('game-info').textContent = `Good luck, ${nickname}!`;

  //adding the functionality to the send chat button
document.getElementById('send-chat').onclick = function() {
    const message = document.getElementById('chat-input').value.trim();
    if (message) {
      sendMessage({ type: 'chat', id: playerID, nickname, message });
      document.getElementById('chat-input').value = ''; //clear input field after sending
    }
  };

  //when wanting to leave the game, redirect to index.html
  document.getElementById('leave-game').onclick = function() {
    sendMessage({type: 'leaveGame', id: playerID})
    window.location = 'index.html';
  };
}
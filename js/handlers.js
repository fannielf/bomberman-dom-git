import { setState, on } from '../framework/index.js';
import { sendMessage } from './ws.js';

console.log('Handlers loaded');

on('playerJoined', ({id, nickname}) => {
  localStorage.setItem('user', JSON.stringify({ id, nickname }));
  window.location.hash = '/lobby';
  sendMessage({ type: 'lobby', id });
});


// Handle game start message
on('gameStarted', ({ map }) => {
  setState({ map });
});


on('showError', (message) => {
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = message;
})


on('updatePlayerCount', ({count, players, gameFull, chatHistory}) => {

  // update count
  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = `Players: ${count}/4`;

  // update player list
  const playerListEl = document.getElementById('player-list');
  if (playerListEl) {
    playerListEl.innerHTML = '';
    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player;
      playerListEl.appendChild(li);
    });
  }

  const chatContainer = document.getElementById('chat');
  if (chatContainer && chatContainer.innerHTML === '') {
    chatHistory.forEach(entry => {
      const div = document.createElement('div');
      div.textContent = `${entry.nickname}: ${entry.message}`;
      chatContainer.appendChild(div);
    });
  }

  // update game full status
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = gameFull ? 'Game is full' : '';

});


// Add countdown handler
on('readyTimer', ({ countdown }) => {
  const timerContainer = document.getElementById('timer');
  if (timerContainer) {
    timerContainer.textContent = `Game starting in: ${countdown} s`;
  }
});
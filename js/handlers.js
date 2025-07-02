import { getState, setState, on } from '../framework/index.js';
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

// Handle player elimination when they lose all lives
on("deActivePlayer", ({ id }) => {
  const { players } = getState();
  const newPlayers = players.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        lives: 0,
        alive: false,
        position: null,
      };
    }
    return p;
});
  console.log("players after elimination:", newPlayers);
  setState({ players: newPlayers });
});

on("leaveGame", ({ id }) => {
  removePlayer(id);
  if (players.size === 0) {
    resetGameState(); 
  }
});

// Handle game end
on("gameEnded", ({ winner }) => {
  setState({ gameInfo: `Twilight fades. The last light is: ${winner}`, gameEnded: true });
});

on("gameReset", () => {
  setState({ 
    gameInfo: '', 
    gameEnded: false,
    players: [],
    map: null,
    bombs: [],
    explosions: [],
  });
  localStorage.removeItem("user"); 
  window.location.hash = "/"; 
});
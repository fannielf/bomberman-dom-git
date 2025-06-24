import { sendMessage } from "./ws.js";
import { on, setState, getState, subscribe, render} from "../framework/index.js"


setState({
  error: '',
  gameFull: false
})

function Index() {
  const { nickname, gameFull, error} = getState();

return {
  tag: 'div',
  attrs: {},
  children: [
    {
      tag: 'input',
      attrs: {
        id: 'nickname-input',
        placeholder: 'Enter nickname',
        value: nickname || ''
      },
      children: []
    },
    {
      tag: 'button',
      attrs: {
        id: 'join-btn',
        disabled: gameFull,
        onclick: () => {
          const nickname = document.getElementById('nickname-input').value.trim();
          if (!nickname) {
            state.error = 'Please enter a nickname';
            return;
          }
          sendMessage({ type: 'join', nickname });
        }
      },
      children: ['Join Game']
    },
    {
      tag: 'p',
      attrs: {
        id: 'error',
        style: 'color:red'
      },
      children: [error || '']
    },
  ]
};
}

const indexRoot = document.body

render(Index(), indexRoot);
const unsubIndex = subscribe(() => render(Index(), indexRoot));

on('showError', (message) => {
    if (window.location.pathname === '/index.html') {
    document.getElementById('error').textContent = message;
  } else if (window.location.pathname === '/lobby.html') {
    document.getElementById('lobby-error').textContent = message;
  }
})

on('updatePlayerCount', ({count, players, gameFull}) => {
  const joinBtn = document.getElementById('join-btn');
  if (joinBtn) joinBtn.disabled = gameFull;

  const errorDiv = document.getElementById('error');
  if (errorDiv) errorDiv.textContent = gameFull ? 'Game is full, waiting for start...' : '';

  const countDiv = document.getElementById('player-count');
  if (!gameFull && countDiv) countDiv.textContent = `Players: ${count}`;

  const playerList = document.getElementById('player-list');
  if (playerList) {
    playerList.innerHTML = ''; // Clear previous list
    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player;
      playerList.appendChild(li);
    });
  }
})

on('playerJoined', ({id, nickname}) => {
  localStorage.setItem('user', JSON.stringify({ id, nickname }));
  sendMessage({ type: 'lobby', id });
  setTimeout(()=> {
    window.location = 'lobby.html';
  }, 100)
  unsubIndex(); // Unsubscribe from index updates
});

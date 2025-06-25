import { setState, getState, on } from '../framework/index.js';
import { sendMessage } from './ws.js';

console.log('Handlers loaded');

on('showError', (message) => {
  setState({
    error: message
  });
})

on('updatePlayerCount', ({count, players, gameFull}) => {
   setState({
    count,
    gameFull,
    players,
  });
})

on('playerJoined', ({id, nickname}) => {
    console.log("Player joined:", id, nickname);
  localStorage.setItem('user', JSON.stringify({ id, nickname }));
  window.location.hash = '/lobby';
  sendMessage({ type: 'lobby', id });
});

// Add countdown handler
on('readyTimer', ({ countdown }) => {
  setState({ countdown });
});

// Handle game start message
on('gameStarted', ({ map }) => {
  setState({ map });
});


// Chat state and handler (can be imported in both lobby and game)
on('newChat', ({ nickname, message }) => {
  const { chatMessages } = getState();
  setState({
    chatMessages: [...chatMessages, { nickname, message }]
  });
});
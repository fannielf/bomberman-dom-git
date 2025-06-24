import { sendMessage } from "./ws.js";
import { on, setState, getState, subscribe, render} from "../framework/index.js"


setState({
  error: '',
  gameFull: false
})

export function Main() {
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
        onclick: (event) => {
          event.preventDefault(); // <-- Add this!
          const nickname = document.getElementById('nickname-input').value.trim();
          if (!nickname) {
            setState({ error: 'Please enter a nickname' });
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

subscribe(() => {render(Main(), document.getElementById('app'))});

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
  localStorage.setItem('user', JSON.stringify({ id, nickname }));
  sendMessage({ type: 'lobby', id });
  window.location.hash = '/lobby';
});

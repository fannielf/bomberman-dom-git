import { emit } from "../framework/index.js";
import { sendMessage, error } from "./ws.js";
import { gameEnded, gameFull, updateGameStarted } from "./logic.js";

export function Main() {
  console.log('Main component loaded');
  if (gameEnded) {
    updateGameStarted(false); // Reset gameStarted state
  }

  let nickname = '';

  const user = JSON.parse(localStorage.getItem('user'));
  const userID = user ? user.id : null;


return {
  tag: 'div',
  attrs: {},
  children: [
    {
      tag: 'h1',
      attrs: {
        id: 'title'
      },
      children: ['Twilight Inferno']
    },
    {
      tag: 'p',
      attrs: {
        id: 'info-text'
      },
      children: ['Twilight falls, the arena ignites… enter your name to join the fight.']
    },
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
          nickname = document.getElementById('nickname-input').value.trim();
          if (!nickname) {
            emit('showError', 'Nickname cannot be empty');
            return;
          }
          sendMessage({ type: 'join', id: userID, nickname });
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

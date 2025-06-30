import { setState, emit } from "../framework/index.js";
import { sendMessage, gameFull, error } from "./ws.js";

export function Main() {
  console.log('Main component loaded');

  let nickname = '';

  const user = JSON.parse(localStorage.getItem('user'));
  const userID = user ? user.id : null;


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

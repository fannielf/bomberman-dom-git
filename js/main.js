import { sendMessage } from "./ws.js";
import { setState, getState, subscribe, render} from "../framework/index.js"

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
        onclick: () => {
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
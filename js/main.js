import { setState, emit } from "../framework/index.js";
import { sendMessage, gameFull, error } from "./ws.js";

export function Main() {
  console.log('Main component loaded');

  let nickname = '';

  const user = JSON.parse(localStorage.getItem('user'));
  const userID = user ? user.id : null;
  document.getElementById('background-video').style.display = 'block';

 

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
      tag: 'button',
      attrs: {
        id: 'music-btn',
        onclick: () => {
          const audio = document.getElementById('background-music');
          const btn = document.getElementById('music-btn');
          if (audio && btn) {
            if (audio.muted || audio.paused) {
              audio.muted = false;
              audio.play();
              btn.style.backgroundImage = 'url("./assets/volume.png")';
            } else {
              audio.muted = true;
              btn.style.backgroundImage = 'url("./assets/mute.png")';
            }
          }
        }
      },
      children: [' '] 
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

import { sendMessage } from "./ws.js";
import {on, setState, getState} from "../framework/index.js"

setState({
  error: '',
  gameFull: false,
  players: [],
  count: 0,
  countdown: null // Add this line
})

const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
  location.hash= '/';
} else {
  sendMessage({ type: 'pageReload', id: user.id });
}

export function Lobby() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.hash = '/';
    return;
  }
  const nickname = user.nickname;
  const playerID = user.id;
  const { error, gameFull, players, count, countdown } = getState(); // Add countdown here

  return {
    tag: 'div',
    attrs: {},
    children: [
      {
        tag: 'h2',
        attrs: {},
        children: ['Lobby']
      },
      {
        tag: 'p',
        attrs: { id: 'welcome' },
        children: [`Welcome, ${nickname}!`]
      },
      {
        tag: 'p',
        attrs: { id: 'player-count' },
        children: [`Players: ${count}/4`]
      },
      // Add countdown display
      countdown !== null ? {
        tag: 'p',
        attrs: { style: 'font-size: 20px; font-weight: bold; color: red;' },
        children: [`Game starting in: ${countdown}`]
      } : null,
      {
        tag: 'ul',
        attrs: { id: 'player-list' },
        children: players.map(name => ({
          tag: 'li',
          attrs: {},
          children: [name]
        }))
      },
      {
        tag: 'div',
        attrs: { id: 'chat' },
        children: []
      },
      {
        tag: 'input',
        attrs: {
          id: 'chat-input',
          placeholder: 'Type your message here...'
        },
        children: []
      },
      {
        tag: 'button',
        attrs: {
          id: 'send-chat',
          onclick: () => {
            const message = document.getElementById('chat-input').value.trim();
            if (message) {
              sendMessage({ type: 'chat', id: playerID, nickname, message });
              document.getElementById('chat-input').value = ''; // Clear input field after sending
            }
          }
        },
        children: ['Send']
      },
      {
        tag: 'p',
        attrs: { id: 'error', style: 'color:red' },
        children: [error || '']
      }
    ]
  };
  }

// Add countdown handler
on('readyTimer', ({ countdown }) => {
  setState({ countdown });
});

on('newChat', ({nickname, message}) => {
  console.log("newChat event received:", nickname, message);
    // If the current page is index.html, do not display chat messages
  if (window.location.pathname === '/index.html') return;

    const chatDiv = document.getElementById('chat');
    const div = document.createElement('div');
    div.innerHTML = `<b>${nickname}:</b> ${message}`;
    chatDiv.appendChild(div);
});



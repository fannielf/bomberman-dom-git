import { sendMessage } from "./ws.js";
import {on, setState, getState, render, subscribe} from "../framework/index.js"

setState({
  error: '',
  gameFull: false
})

const user = JSON.parse(localStorage.getItem('user'));
const nickname = user.nickname
const playerID = user.id;
if (!user) {
  window.location = 'index.html';
} else {

  sendMessage({ type: 'pageReload', id: user.id });
}

function Lobby() {
  const { error, gameFull } = getState();

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

  const lobbyRoot = document.body;
  render(Lobby(), lobbyRoot);
  const unsubLobby = subscribe(() => render(Lobby(), lobbyRoot));


on('newChat', ({nickname, message}) => {
  console.log("newChat event received:", nickname, message);
    // If the current page is index.html, do not display chat messages
  if (window.location.pathname === '/index.html') return;

    const chatDiv = document.getElementById('chat');
    const div = document.createElement('div');
    div.innerHTML = `<b>${nickname}:</b> ${message}`;
    chatDiv.appendChild(div);
});



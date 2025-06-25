import { sendMessage } from "./ws.js";
import { getState, subscribe, render } from "../framework/index.js"
import { Chat } from "./chat.js";

const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
  window.location.hash= '/';
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
  const { error, players, count, countdown } = getState(); // Add countdown here

  return {
    tag: 'div',
    attrs: {},
    children: [
      {
        tag: 'h2',
        attrs: {},
        key: 'lobby-title',
        children: ['Lobby']
      },
      {
        tag: 'p',
        attrs: { id: 'welcome' },
        key: 'welcome-message',
        children: [`Welcome, ${nickname}!`]
      },
      {
        tag: 'p',
        attrs: { id: 'player-count' },
        key: 'player-count',
        children: [`Players: ${count}/4`]
      },
      // Add countdown display
      countdown !== null ? {
        tag: 'p',
        attrs: { style: 'font-size: 20px; font-weight: bold; color: red;' },
        key: 'countdown',
        children: [`Game starting in: ${countdown}`]
      } : null,
      {
        tag: 'ul',
        attrs: { id: 'player-list' },
        key: 'player-list',
        children: players.map((name, index) => ({
          tag: 'li',
          attrs: {},
          key: `player-${index}-${name}`,
          children: [name]
        }))
      },
      {
        tag: 'div',
        attrs: {},
        key: 'chat-container',
        children: [
          Chat({ playerID, nickname }) // Include Chat component
        ]
      },
      {
        tag: 'p',
        attrs: { id: 'error', style: 'color:red' },
        key: 'error-message',
        children: [error || '']
      }
    ]
  };
  }

subscribe(() => {render(Lobby(), document.getElementById('app'))});

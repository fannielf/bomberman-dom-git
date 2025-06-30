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
        attrs: {},
        children: [
          Chat({ playerID, nickname }) // Include Chat component
        ]
      },
      {
        tag: 'p',
        attrs: { id: 'error', style: 'color:red' },
        children: [error || '']
      }
    ]
  };
  }

//subscribe(() => {render(Lobby(), document.getElementById('app'))});

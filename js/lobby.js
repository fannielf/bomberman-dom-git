import { sendMessage } from "./ws.js";
import { setState } from "../framework/index.js"
import { Chat } from "./chat.js";

const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
  window.location.hash= '/';
  setState({ page: '/' });
} else {
  sendMessage({ type: 'pageReload', id: user.id });
}

export function Lobby() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    setState({ page: '/' });
    window.location.hash = '/';
    return;
  }
  const nickname = user.nickname;
  const playerID = user.id;

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
        children: []
      },
      // Add countdown display
      {
        tag: 'p',
        attrs: { id: 'timer', style: 'font-size: 20px; font-weight: bold; color: red;' },
        children: []
      },
      {
        tag: 'ul',
        attrs: { id: 'player-list' },
        children: []
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
        children: []
      }
    ]
  };
  }


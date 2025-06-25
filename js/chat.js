import { sendMessage } from "./ws.js";
import { on, setState, getState } from "../framework/index.js";

export function Chat({ playerID, nickname }) {
  const { chatMessages } = getState();

  return {
    tag: 'div',
    attrs: { id: 'chat-container' },
    children: [
      {
        tag: 'div',
        attrs: { id: 'chat' },
        children: chatMessages.map(({ nickname, message }) => ({
          tag: 'div',
          children: [`${nickname}: ${message}`]
        }))
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
              document.getElementById('chat-input').value = '';
            }
          }
        },
        children: ['Send']
      }
    ]
  };
}

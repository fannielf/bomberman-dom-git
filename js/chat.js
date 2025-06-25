import { sendMessage } from "./ws.js";
import { on, setState, getState } from "../framework/index.js";

export function Chat({ playerID, nickname }) {
  const { chatMessages } = getState();

  return {
    tag: 'div',
    attrs: { id: 'chat-container' },
    key: 'chat-root',
    children: [
      {
        tag: 'div',
        attrs: { id: 'chat' },
        key: 'chat-messages',
        children: chatMessages.map(({ nickname, message }, index) => ({
          tag: 'div',
          key: `message-${index}-${nickname}-${message.substring(0, 10)}`,
          children: [`${nickname}: ${message}`]
        }))
      },
      {
        tag: 'input',
        attrs: {
          id: 'chat-input',
          placeholder: 'Type your message here...'
        },
        key: 'chat-input',
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
        key: 'send-button',
        children: ['Send']
      }
    ]
  };
}

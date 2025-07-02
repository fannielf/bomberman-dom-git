import { sendMessage } from "./ws.js";
import { on } from "../framework/index.js";

export function Chat({ playerID, nickname }) {

  return {
    tag: 'div',
    attrs: { id: 'chat-container' },
    children: [
      {
        tag: 'div',
        attrs: { id: 'chat' },
        children: []
      },
      {
        tag: 'input',
        attrs: {
          id: 'chat-input',
          autofocus: true,
          type: 'text',
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


// Chat state and handler (can be imported in both lobby and game)
on('newChat', ({ nickname, message }) => {
  const chatContainer = document.getElementById('chat');
  if (chatContainer) {
    chatContainer.innerHTML += `<div>${nickname}: ${message}</div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
  }
});


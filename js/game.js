import { Chat } from "./chat.js";
import { sendMessage } from "./ws.js";
import { stopGame, gameStarted, updateGameStarted } from "./logic.js";

export function Game() {

  console.log("Game component loaded");

  const user = JSON.parse(localStorage.getItem("user"));
  console.log("User in Game component:", user);

  if (!user) {
    console.log("No user found");
    emit('reset');
    return;
  }

  if (!gameStarted && user.id) {
    updateGameStarted(true);
  }

  document.getElementById('background-video').style.display = 'none';

  return {
    tag: "div",
    attrs: { id: "game-page-container" },
    children: [
      { 
        tag: "div", 
        attrs: { id: "elimination-message" }, 
        children: ["You are out of lives! You can still watch and chat."] 
      },
      {
        tag: "div",
        attrs: { id: "game-container" },
        children: [
          {
            tag: "h2",
            children: ["Bomberman"],
          },
          {
            tag: "div",
            attrs: { id: "player-lives" },
            children: []
          },
          {
            tag: "div",
            attrs: { id: "game-board" },
            children:[],
          },
          {
            tag: "p",
            attrs: { id: "game-info" },
            children: [],
          },
          {
            tag: "button",
            attrs: {
              id: "leave-game-button", // Add an ID for styling
              onclick: () => {
                sendMessage({ type: "leaveGame", id: user.id });
                stopGame(); // Stop the loop and remove listeners
                emit('reset');
              },
            },
            children: ["Leave Game"],
          },
        ]
      },
      {
        tag: 'div',
        attrs: { id: 'chat-area', class: 'collapsed' },
        children: [
          {
            tag: 'div',
            attrs: {
              id: 'chat-toggle',
              onclick: () => {
                document.getElementById('chat-area').classList.toggle('collapsed');
              }
            },
            children: ['💬']
          },
          Chat({ playerID: user.id, nickname: user.nickname })
        ]
      }
    ]
  };
}

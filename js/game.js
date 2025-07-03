import { Chat } from "./chat.js";
import { sendMessage } from "./ws.js";
import { stopGame } from "./logic.js";
import { currentPlayers } from "./handlers.js";

let gameStarted = false;

export function Game() {

  console.log("Game component loaded");
  
  const user = JSON.parse(localStorage.getItem("user"));
  console.log("User in Game component:", user);
  console.log("Current players:", currentPlayers);


  if (!user) {
    console.log("No user found");
    // window.location.hash = "/";
    // setState({ page: "/" });
    // return;
  }

  if (!gameStarted && user.id) {
    gameStarted = true;
  }

  document.getElementById('background-video').style.display = 'none';

  return {
    tag: "div",
    attrs: { id: "game-page-container" },
    children: [
      {
        tag: "div",
        attrs: { id: "game-container" },
        children: [
          {
            tag: "h2",
            children: ["Twilight Inferno"],
          },
          {
            tag: "div",
            attrs: { id: "player-lives" },
            children: [],
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
          class: "leave-game-button",
              onclick: () => {
                sendMessage({ type: "leaveGame", id: user.id });
                localStorage.removeItem("user");
                stopGame(); // Stop the loop and remove listeners
                window.location.hash = "/";
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

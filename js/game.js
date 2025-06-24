import { sendMessage } from "./ws.js";
import { setState, getState, on } from "../framework/index.js";

setState({
  gameInfo: "",
  map: null
});

export function Game() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.hash = "/";
    return;
  }

  const nickname = user.nickname;
  const playerID = user.id;
  const { gameInfo, map } = getState();

  return {
    tag: "div",
    children: [
      {
        tag: "h2",
        children: ["Bomberman"],
      },
      {
        tag: "div",
        attrs: { id: "game-board" },
        children: map ? renderGameBoard(map) : []
      },
      {
        tag: "p",
        attrs: { id: "game-info" },
        children: [gameInfo || `Good luck, ${nickname}!`],
      },
      {
        tag: "button",
        attrs: {
          onclick: () => {
            sendMessage({ type: "leaveGame", id: playerID });
            window.location.hash = "/";
          },
        },
        children: ["Leave Game"],
      },
      {
        tag: "div",
        attrs: { id: "chat" },
        children: [],
      },
      {
        tag: "input",
        attrs: {
          id: "chat-input",
          placeholder: "Type message...",
        },
      },
      {
        tag: "button",
        attrs: {
          onclick: () => {
            const message = document.getElementById("chat-input").value.trim();
            if (message) {
              sendMessage({ type: "chat", id: playerID, nickname, message });
              document.getElementById("chat-input").value = "";
            }
          },
        },
        children: ["Send"],
      },
    ],
  };
}

function renderGameBoard(map) {
  const cells = [];
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 15; col++) {
      let cellClass = "cell";
      const cellType = map[row] && map[row][col];
      
      if (cellType === "wall") {
        cellClass += " wall";
      } else if (cellType === "destructible-wall") {
        cellClass += " destructible-wall";
      }

      cells.push({
        tag: "div",
        attrs: {
          className: cellClass,
          "data-row": row,
          "data-col": col,
        },
        children: []
      });
    }
  }
  return cells;
}

// Handle game start message
on('gameStarted', ({ map }) => {
  setState({ map });
});

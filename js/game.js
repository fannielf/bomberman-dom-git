import { sendMessage } from "./ws.js";
import { Chat } from "./chat.js";
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
            localStorage.removeItem("user");
            window.location.hash = "/";
          },
        },
        children: ["Leave Game"],
      },
      {
        tag: 'div',
        attrs: {},
        children: [
          Chat({ playerID, nickname }) // Include Chat component
        ]
      },
    ],
  };
}

function renderGameBoard(map) {
  const cells = [];
  const rowLength = map.height || 13; // Default height
  const colLength = map.width || 15; // Default width

  for (let row = 0; row < rowLength; row++) {
    for (let col = 0; col < colLength; col++) {
      let cellClass = "cell";
      const cellType = map.tiles[row][col];
      
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

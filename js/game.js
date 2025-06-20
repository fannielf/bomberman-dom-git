import { createElement } from '../framework/index.js';

const nickname = localStorage.getItem("nickname");
if (!nickname) {
  window.location = "index.html";
} else {
  const socket = new WebSocket("ws://localhost:8080");
  document.getElementById("game-info").textContent = `Good luck, ${nickname}!`;

  // Check if we have a cached map and use it immediately
  const cachedMap = localStorage.getItem("gameMap");
  if (cachedMap) {
    try {
      const map = JSON.parse(cachedMap);
      initializeGameBoard(map);
    } catch (e) {
      console.error("Error parsing cached map:", e);
    }
  }

  // Join the game with page type
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join', nickname, page: 'game' }));
  };

  //adding the chat messages and game state to the DOM
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    if (msg.type === "chat") {
      const chatDiv = document.getElementById("chat");
      const div = document.createElement("div");
      div.innerHTML = `<b>${msg.nickname}:</b> ${msg.message}`;
      chatDiv.appendChild(div);
    }
    
    if (msg.type === "startGame" && msg.map) {
      // Save map to localStorage
      localStorage.setItem("gameMap", JSON.stringify(msg.map));
      initializeGameBoard(msg.map);
    }
  };

  //adding the functionality to the send chat button
  document.getElementById("send-chat").onclick = function () {
    const message = document.getElementById("chat-input").value.trim();
    if (message) {
      socket.send(JSON.stringify({ type: "chat", nickname, message }));
      document.getElementById("chat-input").value = "";
    }
  };

  //when wanting to leave the game, redirect to index.html
  document.getElementById("leave-game").onclick = function () {
    // Clear the map from localStorage when explicitly leaving
    localStorage.removeItem("gameMap");
    window.location = "index.html";
  };

  // Initialize the game board with server map
  function initializeGameBoard(serverMap) {
    const gameBoard = document.getElementById("game-board");
    const rows = 13;
    const cols = 15;

    // Clear existing board
    gameBoard.innerHTML = "";

    // Create grid cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let cellClass = "cell";
        
        // Use server map to set cell types
        const cellType = serverMap[row][col];
        if (cellType === "wall") {
          cellClass += " wall";
        } else if (cellType === "destructible-wall") {
          cellClass += " destructible-wall";
        }

        // Create virtual node using framework
        const cellVNode = {
          tag: "div",
          attrs: {
            className: cellClass,
            "data-row": row,
            "data-col": col
          }
        };
        
        // Create real DOM element using framework
        const cell = createElement(cellVNode);
        gameBoard.appendChild(cell);
      }
    }
  }
}

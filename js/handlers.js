import { on, render, setState, getState } from '../framework/index.js';
import { sendMessage } from './ws.js';
import { startGame, updatePlayerPosition, placeBomb, showExplosion, updatePlayer, renderStaticBoard, renderPlayers, rerenderGame, renderPowerUps, updateMapTiles } from './logic.js';

console.log('Handlers loaded');
let width;
export let currentPlayers = [];

on('playerJoined', ({id, nickname}) => {
  localStorage.setItem('user', JSON.stringify({ id, nickname }));
  window.location.hash = '/lobby';
  sendMessage({ type: 'lobby', id });
});

on('showError', (message) => {
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = message;
})

function appendChatMessage(nickname, message) {
  const chatContainer = document.getElementById('chat');
  if (chatContainer) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.nickname === nickname) {
      messageElement.classList.add('my-message');
    }

    // Use innerHTML to allow for styling of nickname and message separately
    messageElement.innerHTML = `<span class="chat-nickname">${nickname}:</span> <span class="chat-text">${message}</span>`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
  }
}

on('newChat', ({ nickname, message }) => {
  appendChatMessage(nickname, message);
});

on('updatePlayerCount', ({count, players, gameFull, chatHistory}) => {

  // update count in the lobby
  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = `Players: ${count}/4`;

  // update player list
  const playerListEl = document.getElementById('player-list');
  if (playerListEl) {
    playerListEl.innerHTML = '';
    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player;
      playerListEl.appendChild(li);
    });
  }

  const chatContainer = document.getElementById('chat');
  if (chatContainer && chatContainer.innerHTML === '') {
    if (chatHistory) {
      chatHistory.forEach(entry => {
        appendChatMessage(entry.nickname, entry.message);
      });
    }
  }

  // update game full status
  const errorEl = document.getElementById('error');
  if (errorEl) errorEl.textContent = gameFull ? 'Game is full' : '';

});

// Add countdown handler
on('readyTimer', ({ countdown }) => {
  const timerContainer = document.getElementById('timer');
  if (timerContainer) {
    timerContainer.textContent = `Game starting in: ${countdown} s`;
  }
});

// clients handler gets the message from the server when the game starts
on("gameStarted", ({ map, players, chatHistory }) => {
  console.log("gameStarted handler, players", players);
  currentPlayers = players; // store the current players
  width = map.width; // Store the width for rendering players
  renderStaticBoard(map); // render the empty board
  renderPlayers(players, map.width); // render players on the board
  renderPowerUps(map.powerUps, map.width); // Add this line
  startGame(); // start the game loop
  rerenderGame(); //

  const chatContainer = document.getElementById('chat');
  if (chatContainer && chatContainer.innerHTML === '') {
      chatHistory.forEach(entry => {
        appendChatMessage(entry.nickname, entry.message);
    });
  }
});

// Handle player movement updates from the server
on("playerMoved", ({ id, position}) => {
  updatePlayerPosition(id, position); 
});

// Handle bomb placement
on("bombPlaced", ({ bomb }) => {
  placeBomb(bomb);
});

// Handle explosion
on("explosion", ({ bombId, explosion, updatedMap, players }) => {
  // Only remove the specific bomb that exploded
  const bombEl = document.querySelector(`.bomb-${bombId}`);
  if (bombEl) {
    bombEl.remove();
  }

  // Update only the map tiles, don't re-render the entire board
  updateMapTiles(updatedMap);
  renderPlayers(players, updatedMap.width);
  renderPowerUps(updatedMap.powerUps, updatedMap.width);
  showExplosion(explosion);
});

// Handle player updates (e.g., losing a life)
on("playerUpdate", ({ player }) => {
  if (player.lives <= 0 || player.alive === false) {
    return;
  }
  updatePlayer(player);
});

// Handle player elimination when they lose all lives
on("deActivatePlayer", ({ id }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!gameEnded && user.id === id) {
    // create a div to show the message
    const container = document.createElement("div");
    container.id = "elimination-message";
    container.innerHTML = "You are out of lives! You can still watch and chat.";
    document.body.appendChild(container); // body or game container?
  }

});

on("leaveGame", ({ id }) => {
  removePlayer(id);
  if (players.size === 0) {
    resetGameState(); 
  }
});

// Handle game end
on("gameEnded", ({ winner }) => {
  if (gameEnded) return; // Prevent multiple game end messages
  gameEnded = true;
  const gameOver = document.createElement("div");
  gameOver.id = "game-over";
  gameOver.innerHTML = `Game Over! Winner: ${winner}. <br> <button onclick="window.location.hash = '/'">Back to Menu</button>`;
  document.body.appendChild(gameOver);
});

on ("gameUpdate", ({ gameState, players, chatHistory }) => {
  // Update the game state, players, and chat history when reloaded
  console.log("gameUpdate handler, players", players);
  currentPlayers = players;
  renderStaticBoard(gameState.map);
  renderPlayers(players, gameState.map.width);
  rerenderGame();
  
  const chatContainer = document.getElementById('chat');
  if (chatContainer && chatContainer.innerHTML === '') {
    chatHistory.forEach(entry => {
      appendChatMessage(entry.nickname, entry.message);
    });
  }
});

on("sendMessage", ({ msg }) => {
  sendMessage(msg);
});

// Handle power-up pickup
on("powerUpPickup", ({ playerId, powerUpId, newPowerUps }) => {
  // Remove power-up from DOM
  const powerUpEl = document.querySelector(`[data-powerup-id="${powerUpId}"]`);
  if (powerUpEl) {
    powerUpEl.remove();
  }
});

on("gameReset", () => {
  currentPlayers
  gameEnded = false;
  gameInfo = '';
  localStorage.removeItem("user"); 
  window.location.hash = "/"; 
  rerenderGame(); // Rerender the game component
});
import { gameState, players } from "../models";

// can be calculated from the grid if we don't want to hard code positions
const playerPositions = [
    { x: 1, y: 1 },              // Top-left
    { x: 11, y: 9 },             // Bottom-right
    { x: 11, y: 1 },             // Top-right
    { x: 1, y: 9 },              // Bottom-left
];

function addPlayer(ws, nickname) {
  if (players.has(ws) || players.size >= 4 || gameState.status !== 'countdown') return; // Prevent re-adding and limit to 4 players

  const position = playerPositions[players.size];
  players.set(ws, { 
    nickname,
    lives: 3,
    position: { ...position },
  });
}

function removePlayer(ws) {
  players.delete(ws);
}

function looseLife(ws) {
    const player = players.get(ws);
    if (!player) return;
    player.lives--;
    if (player.lives <= 0) {
      removePlayer(ws); // Remove player if lives reach 0
      broadcast({ type: 'playerEliminated', nickname: player.nickname });
    }
}

function getPlayerState(ws) {
  return players.get(ws);
}

function updatePlayerPosition(ws, position) {
  if (players.has(ws)) {
    players.get(ws).position = position;
  }
}

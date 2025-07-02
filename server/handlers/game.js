import { broadcast, sendMsg } from "./connection.js";
import { players, gameState } from "../game/state.js";
import { chatHistory } from "./chat.js";

export function sendGameUpdate(ws = null) {
  const message = {
    type: 'gameUpdate',
    gameState,
    players: Array.from(players.values()).map(c => ({
      id: c.id,
      nickname: c.nickname,
      lives: c.lives,
      alive: c.alive,
      position: c.position,
      speed: c.speed,
      bombRange: c.bombRange,
      bombCount: c.bombCount
    })),
    chatHistory,
  };

  if (ws) {
    sendMsg(ws, message);
  } else {
    broadcast(message);
  }
}
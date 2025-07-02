import { clients } from "./connection.js";
import { addPlayer, startCountdown } from "../game/state.js";

let waitTimer = null;
let firstJoinTime = null;

export function handleJoin(id, ws, data) {

  if (clients.has(id)) { // Prevent re-joining
      ws.send(JSON.stringify({ type: 'playerExists', id: id, nickname: clients.get(id).nickname })); // Notify client of successful join
      return;
    }; 

  if (clients.size >= 4) { // Limit to 4 players
    ws.send(JSON.stringify({ type: 'error', message: 'Game is full', gameFull: clients.size >= 4 }));
    return;

  } else {
    const error = validateNickname(data); // Validate nickname
    if (error) {
      ws.send(JSON.stringify(error)); // Send error if nickname is invalid
      return;
    }

    id = crypto.randomUUID(); // create unique ID
    clients.set(id, { ws, nickname: data.nickname.trim() }); // Store id, connection andn nickname
    ws.send(JSON.stringify({ type: 'playerJoined', id: id, nickname: clients.get(id).nickname})); // Notify client of successful join
    // if game is full, start countdown
    if (clients.size === 4) {
      startCountdown();
      addPlayer();
    }
  }
}

export function readyTimer() {
    if (clients.size === 2 && !waitTimer) {
      firstJoinTime = Date.now(); // Record the time of the first join
      waitTimer = setInterval(() => {
        if (clients.size < 2) {
          clearInterval(waitTimer);
          waitTimer = null;
          firstJoinTime = null;
        } else if (clients.size === 4) { // If 4 players have joined, start the countdown
          statusCountdown();
        } else if (Date.now() - firstJoinTime > 2000) { // If no new joins after 20 seconds, reset
          if (clients.size >= 2) {
          statusCountdown();
          }
        }
      }, 1000); // Check every second
    }
}



function statusCountdown() {
  startCountdown();
  for (const [id, client] of clients) {
    addPlayer({ id, nickname: client.nickname }); // Add players to the game state
  }
  clearInterval(waitTimer);
  waitTimer = null;
  firstJoinTime = null;
}


export function validateNickname(data) {
  if (!data.nickname || data.nickname.trim() === '') {
    return { type: 'error', message: 'Nickname missing' };
  }

  const nickname = data.nickname.trim().toLowerCase();

  for (let client of clients.values()) {
    if (client.nickname.toLowerCase() === nickname) {
      return { type: 'error', message: 'Nickname already taken' };
    }
  }

  return null; // valid
}
import { sendMessage } from "./ws.js";
import { subscribe, getState, render, setState } from "../framework/index.js";
import { startGameLoop } from '../server/gameloop.js';

function GameView() {
  const state = getState();
  const { map, players = {}, bombs = [], explosions = [], info } = state;

  if (!map) {
    return { tag: 'div', children: [ info || 'Waiting for game to start…' ] };
  }

  // build rows of tiles
  const rows = [];
  for (let y = 0; y < map.height; y++) {
    const cells = [];
    for (let x = 0; x < map.width; x++) {
      let cls = map.tiles[y][x] || 'empty';
      if (bombs.find(b => b.x===x && b.y===y))           cls += ' bomb';
      if (explosions.find(e => e.x===x && e.y===y))      cls += ' explosion';
      Object.values(players).forEach(p =>
        p.alive && p.position.x===x && p.position.y===y 
          ? cls += ` player p${p.id}` 
          : null
      );
      cells.push({
        tag: 'div',
        attrs: { class: `tile ${cls}` },
        children: []
      });
    }
    rows.push({
      tag: 'div',
      attrs: { class: 'row' },
      children: cells
    });
  }

  return {
    tag: 'div',
    attrs: { id: 'game-container' },
    children: [
      { tag:'div', attrs:{ id:'game-board' }, children: rows },
      { tag:'p', attrs:{ id:'game-info' }, children:[ info || '' ] }
    ]
  };
}

// --- Local testing setup ---

const emptyTiles = Array.from({ length: 13 }, () => Array(13).fill('empty')); // hardcoded 13x11 grid of empty tiles

// get from the global state later on?
setState({
  // initial state
  map:        { width: 13, height: 13, tiles: emptyTiles },
  players:    { p1: { id: 'p1', position: { x: 0, y: 0 }, alive: true, bombCount: 1 } }, // need to keep track of bombcount for placing multiple or one
  bombs:      [],
  explosions: [],
  info:       'Local testing mode', // used for local testing currently...can be removed when multiplayer is implemented
  playerID:   'p1'               // hardcoded for local testing, should be set by nmbr of players
});

startGameLoop();

// re-render on state changes
const root = document.getElementById("game-board") || document.body;
render(GameView(), root);
subscribe(() => {
  render(GameView(), root);
});

// globally listen for arrows / space, screw event bus
window.addEventListener("keydown", handleKeydown);

function handleKeydown(e) {
  const { players = {}, playerID, info, bombs = [] } = getState();
  const me = players[playerID];
  if (!me || !me.position) return;

  // Movement keys
  const moves = {
    ArrowUp:    [ 0, -1 ],
    ArrowDown:  [ 0,  1 ],
    ArrowLeft:  [ -1, 0 ],
    ArrowRight: [ 1,  0 ]
  };

  if (moves[e.key]) {
    const [dx, dy] = moves[e.key];
    if (info === "Local testing mode") {
      // local movement
      const updated = {
        ...me,
        position: { x: me.position.x + dx, y: me.position.y + dy }
      };
      setState({ players: { ...players, [playerID]: updated } });
    } else {
      // else send move message to server for updates
      sendMessage({ type: "move", id: playerID, dx, dy });
    }
  }

  // Bomb key
  else if (e.key === " ") {
    if (info === "Local testing mode") {
      // Check if the player has reached their bomb limit.
      if (bombs.length >= me.bombCount) {
        return; // Do nothing if the bomb limit is reached
      }
      setState({
        bombs: bombs.concat({
          x: me.position.x,
          y: me.position.y,
          timer: 2000,
        })
      });
    } else {
      // send bomb placement message to server
      sendMessage({ type: "bomb", id: playerID });
    }
  }
}
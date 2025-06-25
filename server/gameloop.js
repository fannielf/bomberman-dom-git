import { emit, getState, setState } from '../framework/index.js';

const DEFAULT_TICKRATE = 60; // Default tick rate in frames per second (fps)
let intervalId = null;
let running = false;

export function startGameLoop({ tickRate = DEFAULT_TICKRATE } = {}) {
  if (running) return;
  running = true;
  const interval = 1000 / tickRate;

  intervalId = setInterval(() => {
    update(); // apply game logic
    emit('tick', { state: getState() }); // notify listeners about the tick
  }, interval);
}

export function stopGameLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  running = false;
}

// main game logic functionality here later on...
function update() {
  const prev = getState();
  const next = {
    ...prev,
    tick: (prev.tick ?? 0) + 1,
  };

  setState(next);
}
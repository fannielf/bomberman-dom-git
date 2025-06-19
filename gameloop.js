import { emit, getState, setState } from './framework/index.js';

const DEFAULT_TICKRATE = 60; // Default tick rate in frames per second (fps)
let interval = 1000 / DEFAULT_TICKRATE; // Interval in milliseconds for each tick

let lastTime = 0; // Last time the frame was rendered
let running = false;
let accumulator = 0; // Accumulator for time

export function startGameLoop({ tickRate = DEFAULT_TICKRATE } = {}) {
  if (running) return;
  running = true;
  interval = 1000 / tickRate;
  lastTime = performance.now();
  accumulator = 0;

  requestAnimationFrame(frame);
}

export function stopGameLoop() {
  running = false;
}

function frame(now) {
  if (!running) return;

  const delta = now - lastTime;
  lastTime = now;
  accumulator += delta;

  while (accumulator >= interval) {
    update(); // apply game logic
    accumulator -= interval;
    emit('tick', { state: getState() }); // notify listeners about the tick,
  }

  requestAnimationFrame(frame); // next frame
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
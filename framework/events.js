const listeners = new Map(); //Map to store the event listeners

/** Subscribe, adds event handlers */
export function on(eventName, handler) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, []);
  }
  listeners.get(eventName).push(handler);
  // return unsubscribe
  return () => off(eventName, handler);
}

/** Emit function to start the listeners for the events */
export function emit(eventName, payload) {
  if (!listeners.has(eventName)) return;
  // copy listeners to avoid in case of modificiations
  [...listeners.get(eventName)].forEach((h) => h(payload));
}

export function off(eventName, handler) {
  if (!listeners.has(eventName)) return;
  const handlers = listeners.get(eventName);
  const index = handlers.indexOf(handler);
  if (index !== -1) {
    handlers.splice(index, 1);
  }
  // If no handlers left, remove the event
  if (handlers.length === 0) {
    listeners.delete(eventName);
  }
}
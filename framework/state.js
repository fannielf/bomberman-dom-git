let state = {}; //object to hold all the apps data
const subscribers = new Set(); //set of funcs to notify when the state changes

export function getState() {
  return state;
}

//unites the old and new state objects
export function setState(newState) {
  state = { ...state, ...newState };
  subscribers.forEach((callback) => callback(state)); //notify all subscribers about the state change
}

// subscribe to state changes
export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback); // Unsubscribe function
}

// Reset the state and clear all subscribers
export function resetState() {
  subscribers.clear();
}

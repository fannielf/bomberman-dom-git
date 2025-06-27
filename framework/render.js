import { createElement, patch } from './dom.js';

const screenMap = new Map(); // screenName -> { vnode, dom }
let currentScreen = null;

// Render
export function render(newVNode, appRoot) {

if (!newVNode) return;

const screenKey = newVNode.key || newVNode.tag || 'Unknown';

// If we're switching to a new screen, remove current DOM and save it
if (currentScreen && currentScreen !== screenKey) {
  const current = screenMap.get(currentScreen);
  if (current && current.dom && appRoot.contains(current.dom)) {
    appRoot.removeChild(current.dom);
  }
}

const saved = screenMap.get(screenKey);
let dom;

if (!saved) { // Initial render
  console.log('Initial render');
    dom = createElement(newVNode);
  } else { // Update render
    console.log('Pathing new VNode');
    dom = patch(saved.dom, saved.vnode, newVNode);
  }
  newVNode.el = dom; // Store the created element in the vnode
  screenMap.set(screenKey, { vnode: newVNode, dom });
  appRoot.appendChild(dom);
  currentScreen = screenKey; // Update current screen
}
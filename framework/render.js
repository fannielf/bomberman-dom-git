import { createElement, patch } from './dom.js';

let rootDom = null; // the actual DOM root created from vnode
let oldVnode = null;  // stores last vnode

// Render
export function render(newVNode, appRoot) {

if (!newVNode) return;

if (!oldVnode) { // Initial render
    rootDom = createElement(newVNode);
    appRoot.innerHTML = ''; // Clear previous content
    //newVNode.el = rootDom; // Store the created element in the vnode
    appRoot.appendChild(rootDom);
  } else { // Update render
    rootDom = patch(rootDom, oldVnode, newVNode);
  }
  oldVnode = newVNode; // Update oldVnode for next render
}
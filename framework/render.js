import { createElement } from './dom.js';

// let rootDom = null; // the actual DOM root created from vnode
// let oldVnode = null;  // stores last vnode

// Render
export function render(newVNode, appRoot) {
  console.log('Rendering new VNode:', newVNode);

if (!newVNode) return;

// if (!oldVnode) { // Initial render
    const rootDom = createElement(newVNode);
    newVNode.el = rootDom; // Store the created element in the vnode
    appRoot.innerHTML = ''; // Clear the appRoot before appending new content
    appRoot.appendChild(rootDom);
  // } else { // Update render
  //   rootDom = patch(rootDom, oldVnode, newVNode);
  // }
  // oldVnode = newVNode; // Update oldVnode for next render
}
import { createElement } from './dom.js';

// Render
export function render(newVNode, appRoot) {

if (!newVNode) return;

    const rootDom = createElement(newVNode);
    newVNode.el = rootDom; // Store the created element in the vnode
    appRoot.innerHTML = ''; // Clear the appRoot before appending new content
    appRoot.appendChild(rootDom);

}
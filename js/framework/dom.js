/* DOM functions */

// createElement function to create DOM elements from a virtual node structure
export function createElement(vnode) {
  //if the type of vnode is a string or number, create a text node
  if (
    vnode == null || 
    typeof vnode === "boolean"
  ) {
    return document.createTextNode("");
  }
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(String(vnode));
  }

  //if the input is an object, create an element node
  const { tag, attrs = {}, children } = vnode;
  const el = document.createElement(tag); //element type is a tag(e.g. "div", "span", etc.)

  setAttributes(el, attrs);

  const childNodes = Array.isArray(children) ? children : [];

  for (const child of childNodes) {
    el.appendChild(createElement(child));
  }

  vnode.el = el; // Store the created element in the vnode for later reference

  return el;
}

// patch function to update the DOM based on changes in the virtual node structure
// patch is only called if there is an oldVnode
export function patch(el, oldVnode, newVnode) {

  // newVnode is null/undefined (node should be removed)
  if (newVnode === undefined || newVnode === null) {
    if (!el?.parentNode) {
      el.parentNode?.removeChild(el);
    }
    return null;
  }

  // Text node case
  if (isTextNode(newVnode) && isTextNode(oldVnode)) {
    if (el.nodeType === Node.TEXT_NODE) {
      const newText = String(newVnode);
      if (el.textContent !== newText) {
        el.textContent = newText;
      }
    } else {
      const newEl = createElement(newVnode);
      el.parentNode.replaceChild(newEl, el);
      return newEl;
    }
    return el;
  }

  // Node type changed (different tags or text node vs element)
  if (isTextNode(newVnode) || isTextNode(oldVnode) || oldVnode.tag !== newVnode.tag) {
    const newEl = createElement(newVnode);
    el?.parentNode?.replaceChild(newEl, el);
    return newEl;

  }

  // Update attributes
  updateAttributes(el, oldVnode.attrs, newVnode.attrs);

  // Update children
  patchChildren(el, oldVnode.children || [], newVnode.children || []);

  newVnode.el = el; // Update the vnode's reference to the DOM element

  return el;
}



/* helper functions */

// isTextNode function to check if a virtual node is a text node (string or number)
function isTextNode(vnode) {
  return typeof vnode === 'string' || typeof vnode === 'number';
}

// isEvent function to check if a key is an event handler
function isEvent(key, value) {
  return key.startsWith('on') && typeof value === 'function';
}

function isStyle(key, value) {
  return key === 'style' && typeof value === 'object';
}

// patchChildren function to update the children of a DOM element
// It handles adding, updating, and removing child nodes based on the new virtual node structure.
function patchChildren(parent, oldChildren = [], newChildren = []) {
  const oldChildNodes = Array.from(parent.childNodes);
  
  const isKeyed = newChildren.some(c => c?.key != null);

  if (isKeyed) {
    // --- KEYED PATCHING ---
    const keyedOld = new Map();
    
    oldChildren.forEach((child, idx) => {
      if (child?.key != null) {
        keyedOld.set(child.key, { vnode: child, el: oldChildNodes[idx] });
      }
    });

    let lastPlaced = null;

    for (const newVNode of newChildren) {
      const key = newVNode?.key;
      let newEl;

      if (key != null && keyedOld.has(key)) {
        const { vnode: oldVNode, el: oldEl } = keyedOld.get(key);
        newEl = patch(oldEl, oldVNode, newVNode);
        keyedOld.delete(key);
      } else {
        newEl = createElement(newVNode);
      }

      const domEl = newEl.el || newEl;
      const nextSibling = lastPlaced?.nextSibling ?? null;
      if (domEl !== nextSibling) {
        parent.insertBefore(domEl, nextSibling);
      }

      lastPlaced = domEl;
    }

    // Remove leftover keyed
    for (const { el } of keyedOld.values()) {
      if (el?.parentNode === parent) {
        parent.removeChild(el);
      }
    }

    // Remove leftover unkeyed (append-only case)
    while (parent.childNodes.length > newChildren.length) {
      parent.removeChild(parent.lastChild);
    }

  } else {
    // --- INDEX-BASED PATCHING ---
    const len = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < len; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const oldEl = oldChildNodes[i];

      if (newVNode == null) {
        if (oldEl) parent.removeChild(oldEl);
      } else if (oldVNode == null) {
        const newEl = createElement(newVNode);
        parent.appendChild(newEl.el || newEl);
      } else {
        patch(oldEl, oldVNode, newVNode);
      }
    }
  }
}


// setAttributes function to set attributes on a DOM element
function setAttributes(el, attrs = {}) {
  if (!el || !attrs || typeof attrs !== "object") {
    return;
  }
  for (const [attr, value] of Object.entries(attrs)) {
    if (isEvent(attr, value)) { // function event handlers
      el[attr.toLowerCase()] = value;
    } else if (isStyle(attr, value)) { // style object
      for (const [prop, val] of Object.entries(value)) {
        el.style[prop] = val;
      }
    } else if (attr === "checked" || attr === "disabled" || attr === "readonly" || attr === "autofocus") {
      el[attr] = value;
    } else if (attr === "value") { // input value
      el.value = value;
    } else if (attr === "class" || attr === "className") { // class attribute
      el.className = value || "";
      el.setAttribute("class", value || "");
    } else if (attr in el) { // properties
      el[attr] = value;
    } else { // attributes
      el.setAttribute(attr === 'className' ? 'class' : attr, value);
    }
  }
}

// updateAttributes function to update attributes of a DOM element
function updateAttributes(el, oldAttrs = {}, newAttrs = {}) {

  if (!el) return;
  // Remove old attributes that no longer exist or have changed
  for (const key in oldAttrs) {
      const oldVal = oldAttrs[key];
      const newVal = newAttrs[key];

      if (!(key in newAttrs) || oldVal !== newVal) { // if key is not in newAttrs or value has changed
        if (isEvent(key, oldVal)) {
          const eventType = key.slice(2).toLowerCase();
          el.removeEventListener(eventType, oldVal);
        } else if (isStyle(key, oldVal)) {
          for (const styleKey in oldVal) {
            if (!newVal || !(styleKey in newVal)) {
              el.style[styleKey] = '';
            }
        }
        } else if (key === 'class' || key === 'className') { // remove class attribute
          el.className = '';
        } else if (key === 'checked' || key === 'disabled' || key === 'readonly' || key === 'autofocus') {
          el[key] = false; // reset boolean attributes
        } else if (key === 'value') {
          el.value = ''; // clear value property (eg. input elements)
        } else {
          el.removeAttribute(key === 'className' ? 'class' : key); // remove other attributes
        }
      }
    }

  // Add or update new attributes
  for (const key in newAttrs) {
    const oldVal = oldAttrs[key];
    const newVal = newAttrs[key];

    if (oldVal === newVal) {
      continue; // No change needed
    }

    if (isEvent(key, newVal)) {
      const eventType = key.slice(2).toLowerCase();
      el[eventType.toLowerCase()] = newVal;
    } else if (isStyle(key, newVal)) {
      for (const styleKey in newVal) {
        el.style[styleKey] = newVal[styleKey];
      }
    } else if (['checked', 'disabled', 'readonly', 'autofocus'].includes(key)) {
      el[key] = newVal; // update boolean attributes
    } else if (key === 'value') { // update input value
      el.value = newVal;
    } else if (key === 'class' || key === 'className') { // update class attribute
      el.className = newVal || '';
    } else if (key in el) { // update properties
      el[key] = newVal;
    } else {
      el.setAttribute(key === 'className' ? 'class' : key, newVal);
    }
  }
}
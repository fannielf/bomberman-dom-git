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
  if (isTextNode(vnode)) {
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
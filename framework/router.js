import { render } from "./render.js";

const routes = new Map(); // Map to store routes and their render functions
let rootEl = null; //DOM element where the content will be rendered

//initRouter function to set up the router
export function initRouter(rootElementId) {
  rootEl = document.getElementById(rootElementId); //find the root element by ID

  window.onhashchange = handleRouteChange; // Handle initial load and hash changes
  window.onload = () => { //clear the hash on initial load
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    handleRouteChange();
  };
}

//addRoute function to register a new route
export function addRoute(path, renderFn) {
  routes.set(path, renderFn);
}

//handleRouteChange function to render the content based on the current route
function handleRouteChange() {
  const path = location.hash.slice(1) || "/"; //current path from the URL, remove the hash
  const renderFn = routes.get(path); //get the render function for the current path

  if (renderFn && rootEl) {
    const vnode = renderFn();
    render(vnode, rootEl); // Render the virtual node to the root element
  }
  
}
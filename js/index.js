import { initRouter, addRoute, subscribe, render } from "../framework/index.js";
import { Main } from "./main.js";
import { Lobby } from "./lobby.js";
import { Game } from "./game.js";

initRouter('app'); // sets up router and assigns root DOM node

addRoute('/', Main);
addRoute('/lobby', Lobby);
addRoute('/game', Game);
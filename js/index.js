import { initRouter, addRoute, setState } from "../framework/index.js";
import { Main } from "./main.js";
import { Lobby } from "./lobby.js";
import { Game } from "./game.js";

initRouter('app'); // sets up router and assigns root DOM node

addRoute('/', Main);
addRoute('/lobby', Lobby);
addRoute('/game', Game);

setState({
  error: '',
  nickname: '',
  players: [],
  gameFull: false,
  count: 0,
  countdown: null,
  chatMessages: [],
  page: 'main' // Default page
})
import { render } from './framework/render.js';
import { NicknameScreen } from './screens/nicknameScreen.js';
import { LobbyScreen } from './screens/lobbyscreen.js';

const appRoot = document.getElementById('app');

export const state = {
  nickname: '',
  error: '',
  joined: false
};

export function renderApp() {
    if (state.joined) {
        render(LobbyScreen(state), appRoot);
      } else {
        render(NicknameScreen(state), appRoot);
      }
    }

renderApp();

//needs to add also the "nickname taken" error functionality related to the websocket
import { state, renderApp } from '../app.js';

export function NicknameScreen(state) {
  if (state.joined) {
    return {
      tag: 'div',
      children: [
        {
          tag: 'p',
          children: [`Welcome, ${state.nickname}!`]
        },
        {
          tag: 'p',
          children: ['(This would now go to the lobby screen)']
        }
      ]
    };
  }

  return {
    tag: 'div',
    attrs: { id: 'nickname-screen' },
    children: [
      {
        tag: 'input',
        attrs: {
          placeholder: 'Enter nickname',
          value: state.nickname,
          oninput: e => {
            state.nickname = e.target.value;
            state.error = '';
            renderApp(); // renews the screen with the updated state
          }
        },
        children: []
      },
      {
        tag: 'button',
        attrs: {
          onclick: () => {
            if (!state.nickname.trim()) {
              state.error = 'Please enter a nickname';
            } else {
              state.error = '';
              state.joined = true;
            }
            renderApp();
          }
        },
        children: ['Join Game']
      },
      state.error
        ? {
            tag: 'p',
            attrs: { style: 'color: red;' },
            children: [state.error]
          }
        : null
    ].filter(Boolean)
  };
}

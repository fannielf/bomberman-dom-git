export function LobbyScreen(state) {
    return {
      tag: 'div',
      attrs: { id: 'lobby-screen' },
      children: [
        { tag: 'h2', children: ['Lobby'] },
        { tag: 'p', children: [`Welcome, ${state.nickname}!`] },
        { tag: 'p', children: [`Players in lobby: ${state.playerCount || 1}/4`] },
        state.timerActive
          ? { tag: 'p', children: [`Game starts in: ${state.timer}s`] }
          : null
        // add chat 
      ].filter(Boolean)
    };
  }
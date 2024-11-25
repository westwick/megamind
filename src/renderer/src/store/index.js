import { createStore } from 'vuex';
import gameModule from './modules/game';
import conversationsModule from './modules/conversations';
import playerConfigModule from './modules/playerConfig';

export default createStore({
  state: {
    isSettingsOpen: false,
  },
  mutations: {
    SET_IS_SETTINGS_OPEN(state, isOpen) {
      state.isSettingsOpen = isOpen;
    },
  },
  modules: {
    game: gameModule,
    conversations: conversationsModule,
    playerConfig: playerConfigModule,
  },
});

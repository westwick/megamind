import { createStore } from "vuex";
import gameModule from "./modules/game";
import conversationsModule from "./modules/conversations";
import playerConfigModule from "./modules/playerConfig";

export default createStore({
  modules: {
    game: gameModule,
    conversations: conversationsModule,
    playerConfig: playerConfigModule,
  },
});

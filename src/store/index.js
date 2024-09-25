import { createStore } from "vuex";
import gameModule from "./modules/game";
import conversationsModule from "./modules/conversations";

export default createStore({
  modules: {
    game: gameModule,
    conversations: conversationsModule,
  },
});

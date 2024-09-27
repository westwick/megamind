const state = {
  roomInfo: null,
  onlineUsers: [],
  playerStats: {},
};

const mutations = {
  SET_ROOM_INFO(state, roomInfo) {
    state.roomInfo = roomInfo;
  },
  SET_ONLINE_USERS(state, users) {
    state.onlineUsers = users;
  },
  SET_PLAYER_STATS(state, stats) {
    state.playerStats = stats;
  },
};

const actions = {
  updateGameState({ commit }, { type, payload }) {
    switch (type) {
      case "NEW_ROOM":
        commit("SET_ROOM_INFO", payload);
        break;
      case "UPDATE_ONLINE_USERS":
        commit("SET_ONLINE_USERS", payload);
        break;
      case "UPDATE_PLAYER_STATS":
        commit("SET_PLAYER_STATS", payload);
        break;
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

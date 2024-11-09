const state = {
  conversations: [],
};

const mutations = {
  ADD_CONVERSATION(state, conversation) {
    state.conversations.push(conversation);
  },
};

const actions = {
  addConversation({ commit }, conversation) {
    commit("ADD_CONVERSATION", conversation);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

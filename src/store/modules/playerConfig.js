const state = {
  auto: {
    autoAll: true,
    autoCombat: true,
    autoHeal: true,
    autoBless: true,
    autoGet: true,
    autoSneak: true,
  },
  health: {
    restMax: 0,
    restIfBelow: 0,
    healWhileResting: 0,
    healCombat: 0,
    runIfBelow: 0,
    hangIfBelow: 0,
  },
  mana: {
    restMax: 0,
    restIfBelow: 0,
    healWhileResting: 0,
    healCombat: 0,
    runIfBelow: 0,
    hangIfBelow: 0,
  },
};

const mutations = {
  SET_CONFIG(state, config) {
    Object.assign(state, config);
  },
  UPDATE_CONFIG(state, { section, newConfig }) {
    if (state[section]) {
      state[section] = { ...state[section], ...newConfig };
    } else {
      console.error(`Section "${section}" does not exist in the state`);
    }
  },
};

const actions = {
  async loadConfig({ commit }) {
    try {
      const config = await window.electronAPI.getPlayerConfig();
      commit("SET_CONFIG", config);
    } catch (error) {
      console.error("Error loading player config:", error);
    }
  },
  async updateConfig({ commit }, { section, newConfig }) {
    try {
      commit("UPDATE_CONFIG", { section, newConfig });
      await window.electronAPI.updatePlayerConfig(section, newConfig);
    } catch (error) {
      console.error(`Error updating ${section} config:`, error);
      throw error;
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

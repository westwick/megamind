const state = {
  autoAll: true,
  autoCombat: true,
  autoHeal: true,
  autoBless: true,
  autoGet: true,
  autoSneak: true,
};

const mutations = {
  SET_CONFIG(state, config) {
    Object.assign(state, config);
  },
  UPDATE_CONFIG(state, { key, value }) {
    if (key in state) {
      state[key] = value;
    }
  },
};

const actions = {
  async loadConfig({ commit }) {
    try {
      if (window.electronAPI && window.electronAPI.getPlayerConfig) {
        const config = await window.electronAPI.getPlayerConfig();
        commit("SET_CONFIG", config);
      } else {
        console.error("electronAPI.getPlayerConfig is not available");
      }
    } catch (error) {
      console.error("Error loading player config:", error);
    }
  },
  async updateConfig({ commit, state }, newConfig) {
    const updatedConfig = {};
    for (const [key, value] of Object.entries(newConfig)) {
      if (key in state) {
        updatedConfig[key] = value;
        commit("UPDATE_CONFIG", { key, value });
      }
    }
    try {
      if (window.electronAPI && window.electronAPI.updatePlayerConfig) {
        await window.electronAPI.updatePlayerConfig(updatedConfig);
      } else {
        console.error("electronAPI.updatePlayerConfig is not available");
      }
    } catch (error) {
      console.error("Error updating player config:", error);
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

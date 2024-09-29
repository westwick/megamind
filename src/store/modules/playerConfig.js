import { ipcRenderer } from "electron";

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
    state[key] = value;
  },
};

const actions = {
  async loadConfig({ commit }) {
    const config = await ipcRenderer.invoke("get-player-config");
    commit("SET_CONFIG", config);
  },
  updateConfig({ commit, state }, newConfig) {
    for (const [key, value] of Object.entries(newConfig)) {
      commit("UPDATE_CONFIG", { key, value });
    }
    ipcRenderer.send("update-player-config", state);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};

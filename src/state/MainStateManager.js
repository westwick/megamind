import { EventEmitter } from "events";

export class MainStateManager extends EventEmitter {
  constructor() {
    super();
    this.state = {
      roomData: null,
      onlineUsers: [],
      playerStats: {},
      conversations: [],
    };
  }

  updateState(key, value) {
    this.state[key] = value;
    this.emit("stateChanged", { key, value });
  }

  getState() {
    return this.state;
  }
}

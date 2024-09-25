export class GameState {
  constructor(eventBus, mainStateManager) {
    this.eventBus = eventBus;
    this.mainStateManager = mainStateManager;

    this.eventBus.on("new-room", this.updateCurrentRoom.bind(this));
    this.eventBus.on("update-online-users", this.updateOnlineUsers.bind(this));
  }

  updateCurrentRoom(room) {
    this.mainStateManager.updateState("roomData", room);
  }

  updateOnlineUsers(users) {
    this.mainStateManager.updateState("onlineUsers", users);
  }

  // Add methods to get state from MainStateManager if needed
  getCurrentRoom() {
    return this.mainStateManager.getState().roomData;
  }

  getOnlineUsers() {
    return this.mainStateManager.getState().onlineUsers;
  }
}

export default GameState;

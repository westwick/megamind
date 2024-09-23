class GameState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.isLoggedIn = false;
    this.hasEnteredGame = false;
    this.hasSentCustomCommand = false;
    this.currentRoom = null;
    this.inCombat = false;
    this.onlineUsers = [];

    this.eventBus.on("new-room", this.updateCurrentRoom.bind(this));
    this.eventBus.on("update-online-users", this.updateOnlineUsers.bind(this));
  }

  updateCurrentRoom(room) {
    this.currentRoom = room;
  }

  updateOnlineUsers(users) {
    this.onlineUsers = users;
  }
}

export default GameState;

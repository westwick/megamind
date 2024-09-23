class GameState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.isLoggedIn = false;
    this.hasEnteredGame = false;
    this.hasSentCustomCommand = false;
    this.currentRoom = null;
    this.inCombat = false;
    this.onlineUsers = [];
  }

  updateOnlineUsers(users) {
    this.onlineUsers = users;
    this.eventBus.emit("online-users-updated", users);
  }
}

export default GameState;

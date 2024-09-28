export class GameState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.isLoggedIn = false;
    this.hasEnteredGame = false;
    this.hasSentCustomCommand = false;
    this.currentRoom = null;
    this.inCombat = false;
    this.onlineUsers = [];
    this.player = {
      healthMax: 37,
      manaMax: 24,
      health: 0,
      mana: 0,
    };

    this.eventBus.on("new-room", this.updateCurrentRoom.bind(this));
    this.eventBus.on("update-online-users", this.updateOnlineUsers.bind(this));
  }

  updateCurrentRoom(room) {
    this.currentRoom = room;
    this.emitState();
  }

  updateOnlineUsers(users) {
    this.onlineUsers = users;
    this.emitState();
  }

  setState(newState) {
    Object.assign(this, newState);
    this.emitState();
  }

  emitState() {
    this.eventBus.emit("game-state-updated", {
      loggedIn: this.isLoggedIn,
      hasEnteredGame: this.hasEnteredGame,
      hasSentCustomCommand: this.hasSentCustomCommand,
      currentRoom: this.currentRoom,
      inCombat: this.inCombat,
      player: this.player,
    });
  }
}

export default GameState;

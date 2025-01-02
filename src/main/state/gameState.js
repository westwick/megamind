/* eslint-disable prettier/prettier */
export default class GameState {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.isLoggedIn = false;
    this.hasEnteredGame = false;
    this.hasSentCustomCommand = false;
    this.currentRoom = {
      items : [],
      entities : [],
      exits : []
    }
    this.inCombat = false;
    this.onlineUsers = [];
    this.player = [];

    this.eventBus.on("new-room", this.updateCurrentRoom.bind(this));
    this.eventBus.on("update-online-users", this.updateOnlineUsers.bind(this));
    this.eventBus.on("update-room-stats", this.udpateRoomStats.bind(this));
    this.eventBus.on("update-status-line", this.updateStatusLine.bind(this));
  
  }

  updateStatusLine(stats){

    let player = {
      health: 0,
      manaType: "",
      mana: 0,
    };

    player.health = stats.values().next().value.hp;
    player.manaType = stats.values().next().value.type;
    player.mana = stats.values().next().value.mana;

    this.player = player;
    this.emitState();
  }

  udpateRoomStats(stats) {
    let currentRoom = {
      name: "",
      items : [],
      entities : [],
      exits : []
    }

    stats.forEach((value, key) => {
      let valueArray = value.items.split(",").map((e) => e.trim());
      switch (key) {
        case 'you-notice' :
          currentRoom.items = valueArray;
          break;
        case 'obvious-exits' :
          currentRoom.exits = valueArray;
          break;
        case 'also-here' :
          currentRoom.entities = valueArray;
          break;
        default :
          break;
      }
      
    })

    this.updateCurrentRoom(currentRoom);
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

class GameState {
  constructor() {
    this.isLoggedIn = false;
    this.hasEnteredGame = false;
    this.hasSentCustomCommand = false;
    this.currentRoom = {
      name: "",
      exits: [],
      mapNumber: 0,
      roomNumber: 0,
    };
  }

  reset() {
    this.isLoggedIn = false;
    this.hasEnteredGame = false;
    this.hasSentCustomCommand = false;
    this.currentRoom = {
      name: "",
      exits: [],
      mapNumber: 0,
      roomNumber: 0,
    };
  }

  updateRoom(name, exits, mapNumber, roomNumber) {
    this.currentRoom.name = name;
    this.currentRoom.exits = exits;
    this.currentRoom.mapNumber = mapNumber;
    this.currentRoom.roomNumber = roomNumber;
  }
}

module.exports = new GameState();

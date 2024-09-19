class GameState {
    constructor() {
      this.isLoggedIn = false;
      this.hasEnteredGame = false;
      this.hasSentCustomCommand = false;
    }
  
    reset() {
      this.isLoggedIn = false;
      this.hasEnteredGame = false;
      this.hasSentCustomCommand = false;
    }
  }
  
  module.exports = new GameState();
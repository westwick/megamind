export default class Handler {
  constructor(eventBus, commandManager, gameState, playerStats) {
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.gameState = gameState;
    this.playerStats = playerStats;
  }
}

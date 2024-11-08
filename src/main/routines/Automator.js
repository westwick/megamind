export default class Automator {
  constructor(main) {
    this.socket = main.socket;
    this.gameState = main.gameState;
    this.playerStats = main.playerStatsInstance;
    this.userConfig = main.userConfig;
    this.realmConfig = main.realmConfig;
    this.eventBus = main;
    this.main = main;
  }
}

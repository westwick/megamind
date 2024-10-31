class WhoHandler {
    constructor(eventBus, commandManager, gameState, playerStats) {
      this.eventBus = eventBus;
      this.commandManager = commandManager;
      this.gameState = gameState;
      this.playerStats = playerStats;
  
      this.eventBus.on("new-message-batch", (event) => {
        this.updateStats(event.lines);
      });
    }
  
    updateStats = (lines) => {
      const firstLine = lines[0];
      if (
        !firstLine ||
        !firstLine.startsWith("Name:") ||
        !firstLine.includes("Lives/CP:")
      ) {
        return; // Not the correct message batch
      }
    }  
}
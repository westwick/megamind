import HealingStrategy from "../strategies/HealingStrategy";

class HealthHandler {
  constructor(eventBus, commandManager, gameState, playerStats) {
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.gameState = gameState;
    this.playerStats = playerStats;
    this.currentStrategy = null;

    this.eventBus.on("new-message-line", (event) => {
      this.handleHealth(event.line);
    });

    this.eventBus.on("health-update", (event) => {
      this.handleHealthUpdate(event.health, event.mana);
    });
  }

  handleHealth(line) {
    const statsMatch = line.match(/\[HP=(\d+)\/MA=(\d+)\]:/);
    if (statsMatch) {
      const hp = parseInt(statsMatch[1], 10);
      const ma = parseInt(statsMatch[2], 10);

      // Check if health or mana has changed
      if (
        hp !== this.gameState.player.health ||
        ma !== this.gameState.player.mana
      ) {
        this.gameState.setState({
          player: {
            ...this.gameState.player,
            health: hp,
            mana: ma,
          },
        });
        this.handleHealthUpdate(hp, ma);
        this.eventBus.emit("health-update", this.gameState.player);
      }
    }
  }

  async handleHealthUpdate(health, mana) {
    if (this.currentStrategy) {
      // If we're already executing a strategy, don't do anything
      return;
    }

    if (health && health < 25 && health > 1) {
      console.log("low health detected");
      this.currentStrategy = new HealingStrategy(
        this.gameState,
        this.commandManager,
        this.eventBus
      );
      await this.executeStrategy();
    }
  }

  async executeStrategy() {
    this.eventBus.emit("strategy-started", { type: "healing" });
    console.log("strategy-started", { type: "healing" });
    while (this.currentStrategy) {
      const completed = await this.currentStrategy.execute();
      if (completed) {
        this.currentStrategy = null;
        this.eventBus.emit("strategy-completed", { type: "healing" });
        console.log("strategy-completed", { type: "healing" });
        break;
      }
      // Add a small delay between executions to prevent tight loops
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export default HealthHandler;

import { ipcMain } from "electron";
import HealingStrategy from "../strategies/HealingStrategy";
import playerConfig from "../state/playerConfig";
import { writeToTerminal } from "../main";

class HealthHandler {
  constructor(eventBus, commandManager, gameState, playerStats) {
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.gameState = gameState;
    this.playerStats = playerStats;
    this.currentStrategy = null;

    this.eventBus.on("new-message-line", (event) => {
      console.log(
        "new-message-line",
        event.line,
        event.message.spans.length
        // JSON.stringify(event.message, null, 2)
        // event.message.spans.map((span) => span.text).join(" | ")
      );
      // this.handleHealth(event.line);
    });

    this.eventBus.on("new-statline-update", (event) => {
      // console.log("new-statline-update", event);
      this.handleHealth(event);
    });

    this.eventBus.on("health-update", (event) => {
      this.handleHealthUpdate(event.health, event.mana);
    });
  }

  handleHealth(event) {
    const { currentHealth, currentMana, resting, meditating } = event;

    // Check if health or mana has changed
    if (
      currentHealth !== this.gameState.player.health ||
      currentMana !== this.gameState.player.mana
    ) {
      this.gameState.setState({
        player: {
          ...this.gameState.player,
          health: currentHealth,
          mana: currentMana,
        },
      });
      this.handleHealthUpdate(currentHealth, currentMana);
      this.eventBus.emit("health-update", this.gameState.player);
    }
  }

  async handleHealthUpdate(health, mana) {
    const config = playerConfig.getConfig();
    const maxHealth = config.stats.maxHealth;
    const hangIfBelowPercentage = config.health.hangIfBelow;
    const hangIfBelowValue = Math.floor(
      maxHealth * (hangIfBelowPercentage / 100)
    );
    if (health <= hangIfBelowValue) {
      ipcMain.emit("disconnect-from-server");
      writeToTerminal("Low Health Detected!!");
    } else if (health <= config.health.runIfBelow) {
      // this.commandManager.send("run");
    }

    // this should be healing strategy
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

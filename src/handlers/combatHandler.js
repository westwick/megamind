import playerConfig from "../state/playerConfig";

class CombatHandler {
  constructor(eventBus, commandManager, gameState, playerStats) {
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.gameState = gameState;
    this.playerStats = playerStats;

    // Add a new property for manual overrides
    this.manualOverrides = {
      ignore: ["healer", "dathalar"], // Entities to never attack (in lowercase)
      attack: [], // Entities to always attack (even if they're players)
    };

    this.eventBus.on("new-message-line", (event) => {
      this.handleCombatState(event.line);
      this.handleExperienceGain(event.line);
      this.handleExpNeededToLevel(event.line);
    });

    this.eventBus.on("new-room", (event) => {
      this.checkEnemies(event);
    });
  }

  checkEnemies(event) {
    if (
      !this.gameState.inCombat &&
      event.entities &&
      event.entities.length > 0
    ) {
      if (playerConfig.getConfig().auto.autoCombat) {
        const targetEntity = this.findSuitableTarget(event.entities);
        if (targetEntity) {
          this.commandManager.sendCommand(`attack ${targetEntity}`);
          this.gameState.setState({ inCombat: true });
        }
      }
    }
  }

  findSuitableTarget(entities) {
    for (const entity of entities) {
      const lowerCaseEntity = entity.toLowerCase();
      if (this.manualOverrides.attack.includes(lowerCaseEntity)) {
        return entity;
      }
      if (
        !this.isPlayer(entity) &&
        !this.manualOverrides.ignore.includes(lowerCaseEntity)
      ) {
        return entity;
      }
    }
    return null;
  }

  handleCombatState(line) {
    if (line.includes("*Combat Engaged*")) {
      this.gameState.setState({ inCombat: true });
    } else if (line.includes("*Combat Off*")) {
      this.gameState.setState({ inCombat: false });
    }
  }

  handleExperienceGain(line) {
    const match = line.match(/You gain (\d+) experience\./);
    if (match) {
      const expGained = parseInt(match[1], 10);
      this.playerStats.addExperience(expGained);
      this.eventBus.emit("experience-gained", expGained);
      this.commandManager.sendCommand("");
    }
  }

  handleExpNeededToLevel(line) {
    const match = line.match(
      /Exp: (\d+) Level: (\d+) Exp needed for next level: (\d+) \((\d+)\) \[(\d+)%\]/
    );
    if (match) {
      const [
        ,
        currentExp,
        level,
        expNeeded,
        totalExpForNextLevel,
        percentComplete,
      ] = match.map(Number);
      this.playerStats.setExpNeededToLevel(expNeeded);
      this.playerStats.setCurrentExp(currentExp);
      this.playerStats.setLevel(level);
      this.playerStats.setTotalExpForNextLevel(totalExpForNextLevel);
      console.log(`Experience needed to level: ${expNeeded}`);
    }
  }

  isPlayer = (entityName) => {
    return this.gameState.onlineUsers.some(
      (user) => user.firstName === entityName
    );
  };
}

export default CombatHandler;

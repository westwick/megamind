import { writeToTerminal } from "../index.js";

class HealingStrategy {
  constructor(gameState, commandManager, eventBus) {
    this.gameState = gameState;
    this.commandManager = commandManager;
    this.eventBus = eventBus;
    this.steps = [
      this.pathToHealer.bind(this),
      this.heal.bind(this),
      this.convertMoney.bind(this),
      this.pathToCombatArea.bind(this),
    ];
    this.currentStepIndex = 0;
    this.expectedRoom = null;
  }

  async execute() {
    if (this.currentStepIndex >= this.steps.length) {
      return true; // Strategy completed
    }

    const currentStep = this.steps[this.currentStepIndex];
    await currentStep();
    this.currentStepIndex++; // Increment the step index

    console.log(
      `Completed step ${this.currentStepIndex} of ${this.steps.length}`
    );

    return this.currentStepIndex >= this.steps.length; // Return true if all steps are completed
  }

  async pathToHealer() {
    console.log("Executing pathToHealer");
    writeToTerminal("Executing pathToHealer");
    this.expectedRoom = "Newhaven, Healer";
    this.commandManager.sendCommand("u");
    this.commandManager.sendCommand("break");
    this.commandManager.sendCommand("w");
    await this.waitForRoom();
  }

  async heal() {
    console.log("Executing heal");
    writeToTerminal("Executing heal");
    this.commandManager.sendCommand("buy healing");
    // Wait for healing to complete (you might need to implement a way to detect this)
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  async convertMoney() {
    console.log("Executing convertMoney");
    writeToTerminal("Executing convertMoney");
    this.expectedRoom = "Newhaven, General Store";
    this.commandManager.sendCommand("e");
    this.commandManager.sendCommand("e");
    this.commandManager.sendCommand("s");
    await this.waitForRoom();
    this.commandManager.sendCommand("buy torch");
    this.commandManager.sendCommand("sell torch");
    // Wait for money conversion to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async pathToCombatArea() {
    console.log("Executing pathToCombatArea");
    writeToTerminal("Executing pathToCombatArea");
    this.expectedRoom = "Newhaven, Arena";
    this.commandManager.sendCommand("n");
    this.commandManager.sendCommand("w");
    this.commandManager.sendCommand("d");
    await this.waitForRoom();
  }

  waitForRoom() {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.roomName === this.expectedRoom) {
          this.eventBus.off("new-room", handler);
          resolve();
        }
      };
      this.eventBus.on("new-room", handler);
    });
  }
}

export default HealingStrategy;

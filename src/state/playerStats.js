export class PlayerStats {
  constructor(eventBus, mainStateManager) {
    this.eventBus = eventBus;
    this.mainStateManager = mainStateManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for relevant events and update state
    this.eventBus.on("experience-gained", this.addExperience);
    // Add more event listeners as needed
  }

  startSession = () => {
    this.mainStateManager.updateState("playerStats", {
      experienceGained: 0,
      sessionStartTime: new Date().toISOString(),
    });
  };

  addExperience = (amount) => {
    const currentStats = this.mainStateManager.getState().playerStats;
    const newExperience = (currentStats.experienceGained || 0) + amount;
    this.mainStateManager.updateState("playerStats", {
      ...currentStats,
      experienceGained: newExperience,
    });
    console.log(`Total experience gained: ${newExperience}`);
  };

  getExperiencePerHour = () => {
    const { sessionStartTime, experienceGained } =
      this.mainStateManager.getState().playerStats;
    if (!sessionStartTime) {
      return 0;
    }
    const now = new Date();
    const hoursElapsed = (now - new Date(sessionStartTime)) / (1000 * 60 * 60);
    return Math.round(experienceGained / hoursElapsed);
  };

  getSessionDuration = () => {
    const { sessionStartTime } = this.mainStateManager.getState().playerStats;
    if (!sessionStartTime) {
      return "0:00:00";
    }
    const now = new Date();
    const durationInSeconds = Math.floor(
      (now - new Date(sessionStartTime)) / 1000
    );
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  getStats = () => {
    const currentStats = this.mainStateManager.getState().playerStats;
    return {
      ...currentStats,
      experiencePerHour: this.getExperiencePerHour(),
      sessionDuration: this.getSessionDuration(),
    };
  };

  reset = () => {
    this.mainStateManager.updateState("playerStats", {
      experienceGained: 0,
      sessionStartTime: null,
    });
  };
}

export default PlayerStats;

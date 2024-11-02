export class PlayerStats {
  constructor() {
    this.sessionStartTime = null;
    this.experienceGained = 0;
    this.expNeededToLevel = 0;
    this.currentExp = 0;
    this.level = 0;
    this.totalExpForNextLevel = 0;
  }

  startSession = () => {
    this.sessionStartTime = new Date();
    this.experienceGained = 0;
  };

  addExperience = (amount) => {
    this.experienceGained += amount;
    this.currentExp += amount;
    this.expNeededToLevel = Math.max(0, this.expNeededToLevel - amount);
  };

  setExpNeededToLevel = (amount) => {
    this.expNeededToLevel = amount;
  };

  setCurrentExp = (amount) => {
    this.currentExp = amount;
  };

  setLevel = (level) => {
    this.level = level;
  };

  setTotalExpForNextLevel = (amount) => {
    this.totalExpForNextLevel = amount;
  };

  getTimeToLevel = () => {
    if (this.expNeededToLevel === 0 || this.getExperiencePerHour() === 0) {
      return "N/A";
    }
    const hoursToLevel = this.expNeededToLevel / this.getExperiencePerHour();
    return this.formatTime(hoursToLevel);
  };

  formatTime = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours % 1) * 60);
      return `${wholeHours}h ${minutes}m`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  getExperiencePerHour = () => {
    if (!this.sessionStartTime) {
      return 0;
    }
    const now = new Date();
    const hoursElapsed = (now - this.sessionStartTime) / (1000 * 60 * 60);
    return Math.round(this.experienceGained / hoursElapsed);
  };

  getSessionDuration = () => {
    if (!this.sessionStartTime) {
      return "0:00:00";
    }
    const now = new Date();
    const durationInSeconds = Math.floor((now - this.sessionStartTime) / 1000);
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  getStats = () => {
    return {
      sessionDuration: this.getSessionDuration(),
      sessionStartTime: this.sessionStartTime,
      experienceGained: this.experienceGained,
      experiencePerHour: this.getExperiencePerHour(),
      expNeededToLevel: this.expNeededToLevel,
      timeToLevel: this.getTimeToLevel(),
    };
  };

  reset = () => {
    this.experienceGained = 0;
    this.sessionStartTime = null;
  };
}

export default new PlayerStats();

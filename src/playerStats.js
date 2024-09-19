class PlayerStats {
    constructor() {
      this.experienceGained = 0;
      this.sessionStartTime = null;
    }
  
    startSession() {
      this.sessionStartTime = new Date();
      this.experienceGained = 0;
    }
  
    addExperience(amount) {
      this.experienceGained += amount;
      console.log(`Total experience gained: ${this.experienceGained}`);
    }
  
    getExperiencePerHour() {
      if (!this.sessionStartTime) {
        return 0;
      }
      const now = new Date();
      const hoursElapsed = (now - this.sessionStartTime) / (1000 * 60 * 60);
      return Math.round(this.experienceGained / hoursElapsed);
    }
  
    getSessionDuration() {
      if (!this.sessionStartTime) {
        return '0:00:00';
      }
      const now = new Date();
      const durationInSeconds = Math.floor((now - this.sessionStartTime) / 1000);
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = durationInSeconds % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  
    getStats() {
      return {
        experienceGained: this.experienceGained,
        experiencePerHour: this.getExperiencePerHour(),
        sessionDuration: this.getSessionDuration(),
        sessionStartTime: this.sessionStartTime
      };
    }
  
    reset() {
      this.experienceGained = 0;
      this.sessionStartTime = null;
    }
  }
  
  module.exports = new PlayerStats();
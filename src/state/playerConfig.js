import fs from "fs";
import path from "path";
import { app } from "electron";

class PlayerConfig {
  constructor() {
    this.configPath = path.join(app.getAppPath(), "playerConfig.json");
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading player config:", error);
    }
    return this.getDefaultConfig();
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("Error saving player config:", error);
    }
  }

  getDefaultConfig() {
    return {
      autoAll: true,
      autoCombat: true,
      autoHeal: true,
      autoBless: true,
      autoGet: true,
      autoSneak: true,
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getConfig() {
    return this.config;
  }
}

export default new PlayerConfig();

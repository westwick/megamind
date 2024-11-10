import playerConfig from '../state/playerConfig.js';
import Handler from './Handler.js';

class StatsHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.eventBus.on('new-message-batch', (event) => {
      this.updateStats(event.lines);
    });
  }

  updateStats = (lines) => {
    const firstLine = lines[0];
    if (!firstLine || !firstLine.startsWith('Name:') || !firstLine.includes('Lives/CP:')) {
      return; // Not the correct message batch
    }

    const stats = {};
    // stats.name = firstLine.split('Name:')[1].trim().split(/\s+/)[0];
    stats.lives = parseInt(firstLine.split('Lives/CP:')[1].trim().split('/')[0]);
    // stats.cp = parseInt(firstLine.split('Lives/CP:')[1].trim().split('/')[1]);

    lines.slice(1).forEach((line) => {
      const parts = line.split(/(\w+):\s*/).filter(Boolean);
      for (let i = 0; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];
        switch (key) {
          case 'Race':
            stats.race = value.trim();
            break;
          case 'Class':
            if (i === 0) {
              // dont get confused with armour class
              stats.class = value.trim();
            }
            break;
          case 'Level':
            stats.level = parseInt(value);
            break;
          case 'Hits':
            stats.maxHealth = parseInt(value.split('/')[1]);
            break;
          case 'Mana':
            stats.maxMana = parseInt(value.split('/')[1]);
            break;
        }
      }
    });

    stats.lastUpdated = new Date().toISOString();

    // Update the config with the new stats
    playerConfig.updateConfig('stats', stats);
  };
}

export default StatsHandler;

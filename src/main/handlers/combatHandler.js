import playerConfig from '../state/playerConfig.js';
import { writeToTerminal } from '../index.js';
import Handler from './Handler.js';

class CombatHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.currentRound = [];
    this.roundNumber = 0;
    this.lastRoundStartTime = null;
    this.timeSinceLastRound = null;

    this.manualOverrides = {
      ignore: ['healer', 'dathalar'], // Entities to never attack (in lowercase)
      attack: [], // Entities to always attack (even if they're players)
    };

    this.eventBus.on('new-message-line', (event) => {
      this.handleCombatState(event.line);
      this.handleExperienceGain(event.line);
      this.handleExpNeededToLevel(event.line);
      this.handleCombatMessage(event); // Add this line
    });

    this.eventBus.on('new-room', (event) => {
      this.checkEnemies(event);
    });

    this.debouncedEndRound = this.debounce(this.endRound, 100);
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  checkEnemies(event) {
    if (!this.gameState.inCombat && event.entities && event.entities.length > 0) {
      if (playerConfig.getConfig().auto.autoCombat) {
        const targetEntity = this.findSuitableTarget(event.entities);
        if (targetEntity) {
          this.commandManager.sendCommand(`attack ${targetEntity}`);
          // shouldnt need this, should verify with the *Combat Engaged* message
          // but sometimes we issue the attack command twice, was trying to prevent that
          // this.gameState.setState({ inCombat: true });
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
      if (!this.isPlayer(entity) && !this.manualOverrides.ignore.includes(lowerCaseEntity)) {
        return entity;
      }
    }
    return null;
  }

  handleCombatState(line) {
    if (line === '*Combat Engaged*') {
      this.gameState.setState({ inCombat: true });
    } else if (line === '*Combat Off*') {
      this.gameState.setState({ inCombat: false });
    }
  }

  handleExperienceGain(line) {
    const match = line.match(/^You gain (\d+) experience\./);
    if (match) {
      const expGained = parseInt(match[1], 10);
      this.playerStats.addExperience(expGained);
      this.eventBus.emit('experience-gained', expGained);
      this.commandManager.sendCommand('');
    }
  }

  handleExpNeededToLevel(line) {
    const match = line.match(/Exp: (\d+) Level: (\d+) Exp needed for next level: (\d+) \((\d+)\) \[(\d+)%\]/);
    if (match) {
      const [, currentExp, level, expNeeded, totalExpForNextLevel, percentComplete] = match.map(Number);
      this.playerStats.setExpNeededToLevel(expNeeded);
      this.playerStats.setCurrentExp(currentExp);
      this.playerStats.setLevel(level);
      this.playerStats.setTotalExpForNextLevel(totalExpForNextLevel);
      console.log(`Experience needed to level: ${expNeeded}`);
    }
  }

  handleCombatMessage(event) {
    const { line, message, timestamp } = event;

    // Check if the message is bright red (combat hit) or teal (miss/dodge)
    const isCombatHit = message.spans.some((span) => span.color && span.color.name === 'red' && span.color.bright);
    const isMissOrDodge = message.spans.some((span) => span.color && span.color.name === 'cyan' && !span.color.bright);

    if (isCombatHit || isMissOrDodge) {
      const entities = this.gameState.currentRoom?.entities || [];

      let attacker, target, damage;
      const isCritical = line.includes('critically');
      const isDodge = line.includes('dodge');

      const hitPattern = /^(You|The .+?) .+ (.+?) for (\d+) damage!/;
      const missPattern = /^(You|The .+?) .+ (.+?)(?:, but .+)?!$/;

      let match;
      if (isCombatHit) {
        match = line.match(hitPattern);
        if (match) {
          [, attacker, target, damage] = match;
        }
      } else {
        match = line.match(missPattern);
        if (match) {
          [, attacker, target] = match;
        }
      }

      if (match) {
        // Normalize entity names
        attacker = attacker === 'You' ? '[self]' : this.normalizeEntityName(attacker.replace(/^The /, ''), entities);
        target = target === 'you' ? '[self]' : this.normalizeEntityName(target, entities);

        const combatEvent = {
          timestamp,
          attacker,
          target,
          damage: damage ? parseInt(damage, 10) : null,
          hit: isCombatHit,
          miss: isMissOrDodge && !isDodge,
          dodge: isDodge,
          critical: isCritical,
        };

        if (this.currentRound.length === 0) {
          // This is the first event of a new round
          this.timeSinceLastRound = this.lastRoundStartTime ? timestamp - this.lastRoundStartTime : null;

          if (this.timeSinceLastRound !== null) {
            // writeToTerminal(
            //   `Time since last combat round: ${timeSinceLastRound} ms`
            // );
          }

          this.lastRoundStartTime = timestamp;
        }

        this.currentRound.push(combatEvent);
        this.debouncedEndRound();
      }
    }
  }

  endRound = () => {
    if (this.currentRound.length > 0) {
      this.roundNumber++;
      const roundSummary = {
        roundNumber: this.roundNumber,
        events: this.currentRound,
        startTime: this.currentRound[0].timestamp,
        endTime: this.currentRound[this.currentRound.length - 1].timestamp,
      };

      this.eventBus.emit('combat-round', roundSummary);
      console.log('Combat round:', roundSummary);

      // Calculate total damage dealt and received
      let damageDealt = 0;
      let damageReceived = 0;
      let dodges = 0;

      this.currentRound.forEach((event) => {
        if (event.hit && event.damage) {
          if (event.attacker === '[self]') {
            damageDealt += event.damage;
          } else if (event.target === '[self]') {
            damageReceived += event.damage;
          }
        }
        if (event.dodge && event.target === '[self]') {
          dodges++;
        }
      });

      const coloredMessage = [
        '\x1b[40m', // Set background to black
        '\x1b[1;36m',
        `${this.timeSinceLastRound} ms`, // Bright cyan
        '\x1b[0;37m',
        `. `, // White
        '\x1b[1;32m',
        `Damage dealt: ${damageDealt}`, // Bright green
        '\x1b[0;37m',
        `, `, // White
        '\x1b[1;31m',
        `Damage received: ${damageReceived}`, // Bright red
        '\x1b[0;37m',
        `, `, // White
        '\x1b[1;35m',
        `Dodges: ${dodges}`, // Bright magenta
        '\x1b[0m', // Reset all styles
      ].join('');

      writeToTerminal(coloredMessage);

      this.currentRound = [];
    }
  };

  normalizeEntityName(name, entities) {
    // Check if the name is already an exact match
    if (entities.includes(name)) return name;

    // Check for partial matches
    const lowerName = name?.toLowerCase();
    const match = entities.find((entity) => entity?.toLowerCase().includes(lowerName));
    return match || name;
  }

  isPlayer = (entityName) => {
    return this.gameState.onlineUsers.some((user) => user.firstName === entityName);
  };
}

export default CombatHandler;

import Player from '../entities/Player.js';
import RealmData from '../entities/realmData.js';

export default class WhoHandler {
  constructor(eventBus, commandManager, gameState, playerStats) {
    this.eventBus = eventBus;
    this.commandManager = commandManager;
    this.gameState = gameState;
    this.playerStats = playerStats;

    if (this.eventBus) {
      this.eventBus.on('new-message-batch', async (event) => {
        await this.updatePlayers(event.lines);
      });
    }
  }

  async updatePlayers(lines) {
    this.realmData = await RealmData.find('default');

    for (let i = 0; i < lines.length - 1; i++) {
      let players;

      if (/^\s+Current Adventurers\s*$/.test(lines[i]) && /^\s+===================\s*$/.test(lines[i + 1])) {
        players = await this.fromFantasyStyleWhoList(lines.slice(2));
      } else if (/^\s+Title\s+Name\s+Reputation\s+Gang\/Guild\s*$/.test(lines[i])) {
        players = await this.fromTechnicalStyleWhoList(lines.slice(2));
      }

      if (players) {
        this.gameState.onlineUsers = this.realmData.players = players;
      }

      return players;
    }
  }

  async fromFantasyStyleWhoList(lines) {
    let players = [];

    const patternText =
      '^\\s*( {8}|' + // 8 spaces for neutral characters
      this.realmData.alignments.join('|') + // or a named alignment
      ') (\\w+) (\\w+)? *([-x])  (' +
      this.realmData.getAllTitles().join('|') +
      ") *(?: of ([\\w .'!#&]+?)(?=(?: (?:M|S|V))? *$))?(?: (M|S|V))?$";

    const whoListPattern = new RegExp(patternText);

    for (const line of lines) {
      const result = whoListPattern.exec(line);

      if (result) {
        const [, alignment, first, last, flags, title, gang, status] = result;

        let player = await Player.find(first);

        if (!player) {
          player = await Player.create(first);
        }

        player.name = first;
        player.last = last;
        player.alignment = alignment;
        player.flags = flags;
        player.title = title;
        player.gang = gang;
        player.status = status;
        player.levelRange = this.realmData.findLevelRangeByTitle(title);
        player.class = this.realmData.findClassByTitle(title);
        await player.save();

        players.push(player);
      }
    }

    return players;
  }

  async fromTechnicalStyleWhoList(lines) {
    let players = [];

    // Skip header lines
    const dataLines = lines.slice(2);

    for (const line of dataLines) {
      const title = line.substring(0, 15).trim();
      const nameSection = line.substring(15, 35).trim();
      const [first, ...lastParts] = nameSection.split(' ');
      const last = lastParts.join(' ');
      const flags = line.substring(35, 37);
      const alignment = line.substring(37, 47).trim();
      const gang = line.substring(47).trim();

      let player = await Player.find(first);

      if (!player) {
        player = await Player.create(first);
      }

      player.name = first;
      player.last = last;
      player.title = title;
      player.flags = flags;
      player.alignment = alignment;
      player.gang = gang;
      player.levelRange = this.realmData.findLevelRangeByTitle(title);
      player.class = this.realmData.findClassByTitle(title);
      await player.save();

      players.push(player);
    }

    return players;
  }
}

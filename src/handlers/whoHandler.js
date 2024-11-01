import Player from '../entities/Player.js';
import RealmData from '../entities/realmData.js';

export default class WhoHandler {
    constructor(eventBus, commandManager, gameState, playerStats) {
      this.eventBus = eventBus;
      this.commandManager = commandManager;
      this.gameState = gameState;
      this.playerStats = playerStats;
  
      if (this.eventBus) {
        this.eventBus.on("new-message-batch", async (event) => {
          await this.updatePlayers(event.lines);
        });
      }
    }
  
    async updatePlayers(lines) {
      for (let i = 0; i < lines.length - 1; i++) {
          if (/^\s+Current Adventurers\s*$/.test(lines[i]) && 
              /^\s+===================\s*$/.test(lines[i + 1])) {
            
            this.realmData = await RealmData.find('default');
            const players = await this.fromWhoList(lines);
            
            this.realmData.players = players;
          }
      }
    }  

    async fromWhoList(lines) {
      let players = [];
  
      const patternText = "^\\s*( {8}|" + this.realmData.alignments.join('|') + ") (\\w+) (\\w+)? *([-x])  (" + this.realmData.getAllTitles().join('|') + ") *(?: of ([\\w .'!#&]+?)(?=(?: (?:M|S|V))? *$))?(?: (M|S|V))?$";
      const whoListPattern = new RegExp(patternText);

      for (const line of lines) {
        const result = whoListPattern.exec(line);

        if (result) {
          const [, alignment, first, last, flags, title, gang, status] = result;
          
          let player = await Player.find(first);

          if (!player) {
            player = Player.new(first);
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

          players.push(player);
        }
      }

      return players;
  }
}
/* eslint-disable prettier/prettier */
import { parse } from 'ansicolor';
import RoomHandler from '../handlers/roomHandler.js';
import ConversationHandler from '../handlers/conversationHandler.js';
import CombatHandler from '../handlers/combatHandler.js';
import HealthHandler from '../handlers/healthHandler.js';
import StatsHandler from '../handlers/statsHandler.js';
import MessageHandler from '../handlers/messageHandler.js';
import WhoHandler from '../handlers/whoHandler.js';
import StatusLineHandler from '../handlers/statusLineHandler.js';
import CommandManager from './commandManager.js';
import Automator from './Automator.js';
import '../util/Extensions.js';
import { classifyLine, classifyBatch, removeBackspaces, formatLine, patterns } from './classifier.js';

export default class MudAutomator extends Automator {
  constructor(...args) {
    super(...args);

    console.log('MudAutomator started');
    this.rawDataBuffer = [];
    this.maxRawDataBufferSize = 10; // Store last 10 raw data chunks
    this.incompleteLineBuffer = '';
    this.startStatsUpdateInterval();
    this.commandManager = new CommandManager(this.socket);

    this.roomHandler = new RoomHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);

    this.conversationHandler = new ConversationHandler(
      this.eventBus,
      this.commandManager,
      this.gameState,
      this.playerStats
    );

    this.combatHandler = new CombatHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.healthHandler = new HealthHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.statsHandler = new StatsHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.whoHandler = new WhoHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.messageHandler = new MessageHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);

    this.statusLineHandler = new StatusLineHandler(
      this.eventBus,
      this.commandManager,
      this.gameState,
      this.playerStats
    );
  }

  parse = (data) => {
    let dataString = data.dataTransformed;

    if (dataString.lastIndexOf("-=") > 0){
        dataString = dataString.substring(dataString.lastIndexOf("-=")+2, dataString.length)
    }
      
    const lines = dataString
      .split('\r\n')
      .flatMap((line) => line.split('\x1B[79D\x1B[K'))
      .filter((line) => line.trim() !== '');
    
    let newCurrentLine = "";
    let newCurrentLineNumber = 0;

    let newLines = new Map()
      
     // re do line lines so the line below is concatenated if the color
    for (var i = 0; i < lines.length; i++) {
       let thisLine = lines[i];
       let currentLineParse = parse(thisLine)
 
       if (currentLineParse.spans) {
        // if a line has a color, its a new 'new' line
        // if the line has no color, we assume its part of the previous 'new' line

        // TODO: this may become an issue during combat but we will see

        // for the first iteration its going to be differnet
        // append what we have to the line and move on
        if (i == 0) {
          newCurrentLine += (" " + lines[i])
          continue;
        }

        // now if the next line has no color.. we will assume its part of the previous line.. keep appending
        // until we find a line with a color
        if (currentLineParse.spans[0].color) {
          // once we find a color.. push what we already had, rest the pushed line.
          newLines.set(newCurrentLineNumber++, newCurrentLine)
          
          // reset the current New Line
          // we have to consider that more will come if the next line has no color
          // we will append until it has a color, 
          newCurrentLine = lines[i];
        } else {
          newCurrentLine += (" " + lines[i])
        }

        if (i == (lines.length -1 )) {
          newLines.set(newCurrentLineNumber++, newCurrentLine)
        }
      }
    }

    console.log(newLines)

    // a new map to hold the groups
    let groupedMaps = new Map();

    newLines.forEach((value, key) => {
      value = value.stripAnsi();

      // has backspace character, remove that and the one before
      if (value.startsWith("Obvious exits:")){
        value = removeBackspaces(value);
      }

      // classify each line, if it has a parent classification, add it to its own group to be processed at once
      const classified = classifyLine(value);
      if (classified) {
        if (classified.parentEvent){
          if (!groupedMaps.has(classified.parentEvent)){
            groupedMaps.set(classified.parentEvent, new Map())
          }
          groupedMaps.get(classified.parentEvent).set(classified.event, classified.matches)
        }
      }
    }) 

    if (groupedMaps.size > 0) {
      this.processGroupedMessages(groupedMaps);
    }
  }

  // TODO: probably put this in its own handler if it gets out of hand
  processGroupedMessages = (groupMessages) => {
    this.eventBus.emit('process-messages', groupMessages);
  };

  updatePlayerStats = () => {
    const stats = this.playerStats.getStats();
    this.eventBus.emit('update-player-stats', stats);
  };

  startStatsUpdateInterval = () => {
    // Update stats every 5 seconds
    setInterval(() => {
      this.updatePlayerStats();
    }, 5000);
  };

  sendCommand = (command) => {
    this.socket.write(command + '\r');
  };
}


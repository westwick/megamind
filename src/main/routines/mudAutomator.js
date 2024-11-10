import { parse } from 'ansicolor';
import RoomHandler from '../handlers/roomHandler.js';
import ConversationHandler from '../handlers/conversationHandler.js';
import CombatHandler from '../handlers/combatHandler.js';
import HealthHandler from '../handlers/healthHandler.js';
import StatsHandler from '../handlers/statsHandler.js';
import WhoHandler from '../handlers/whoHandler.js';
import StatusLineHandler from '../handlers/statusLineHandler.js';
import CommandManager from './commandManager.js';
import Automator from './Automator.js';
import '../util/Extensions.js';
import { classifyLine, classifyBatch } from './classifier.js';

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

    this.statusLineHandler = new StatusLineHandler(
      this.eventBus,
      this.commandManager,
      this.gameState,
      this.playerStats
    );
  }

  parse = (data) => {
    const dataString = data.dataTransformed;

    // Store raw data
    this.rawDataBuffer.push(dataString);
    if (this.rawDataBuffer.length > this.maxRawDataBufferSize) {
      this.rawDataBuffer.shift();
    }

    // Prepend any incomplete line from the previous chunk
    let fullData = this.incompleteLineBuffer + dataString;
    this.incompleteLineBuffer = '';

    // Split the data into lines
    const lines = fullData
      .split('\r\n')
      .flatMap((line) => line.split('\x1B[79D\x1B[K'))
      .filter((line) => line.trim() !== '');

    // console.log("lines", lines);

    // If the last line is incomplete, store it for the next chunk
    if (!fullData.endsWith('\r\n')) {
      this.incompleteLineBuffer = lines.pop();

      const classified = classifyLine(this.incompleteLineBuffer.stripAnsi());

      if (classified && classified.event === 'status-line') {
        this.eventBus.emit(classified.event, this.incompleteLineBuffer.stripAnsi(), classified.matches);
      }
    }

    const parsedSpans = lines.map((line) => parse(line));

    this.processMessage(parsedSpans);
  };

  processMessage = (messages) => {
    const lines = messages.flatMap((msg) => {
      if (msg && msg.spans && msg.spans.length > 0) {
        const strippedSpans = msg.spans.map((x) => x.text.stripAnsi());
        const line = strippedSpans.join('');

        const classified = classifyLine(line);

        if (classified?.parentEvent) {
          this.eventBus.emit(classified.parentEvent, line, classified.matches);
        }

        if (classified?.event) {
          console.log('lineEvent', classified.event);
          this.eventBus.emit(classified.event, line, classified.matches);
        }

        return line;
      }
      return [];
    });

    const classified = classifyBatch(lines);

    if (classified?.parentEvent) {
      this.eventBus.emit(classified.parentEvent, lines, classified.matches);
    }

    if (classified?.event) {
      console.log('batchEvent', classified.event);
      this.eventBus.emit(classified.event, lines, classified.matches);
    }
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

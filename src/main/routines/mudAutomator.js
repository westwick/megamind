import { parse } from 'ansicolor';
import RoomHandler from '../handlers/roomHandler';
import ConversationHandler from '../handlers/conversationHandler';
import CombatHandler from '../handlers/combatHandler';
import HealthHandler from '../handlers/healthHandler';
import StatsHandler from '../handlers/statsHandler';
import WhoHandler from '../handlers/whoHandler';
import CommandManager from './commandManager';
import Automator from './Automator';
import '../util/Extensions';

export default class MudAutomator extends Automator {
  constructor(...args) {
    super(...args);

    console.log('MudAutomator started');
    this.rawDataBuffer = [];
    this.maxRawDataBufferSize = 10; // Store last 10 raw data chunks
    this.incompleteLineBuffer = '';
    this.startStatsUpdateInterval();
    this.commandManager = new CommandManager(this.socket);

    this.roomHandler = new RoomHandler(this.eventBus, this.commandManager);
    this.conversationHandler = new ConversationHandler(this.eventBus);
    this.combatHandler = new CombatHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.healthHandler = new HealthHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.statsHandler = new StatsHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
    this.whoHandler = new WhoHandler(this.eventBus, this.commandManager, this.gameState, this.playerStats);
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

      // if the incomplete line contains only statline information, parse that and clear buffer
      const strippedLine = this.incompleteLineBuffer.stripAnsi();
      const statlineRegex = /\[HP=(\d+)(?:\/MA=(\d+))?]:\s*(?:\((Resting|Meditating)\))?/;
      const match = strippedLine.match(statlineRegex);

      if (match) {
        const [, currentHealth, currentMana, state] = match;
        const statlineUpdate = {
          currentHealth: parseInt(currentHealth, 10),
          currentMana: currentMana ? parseInt(currentMana, 10) : undefined,
          resting: state === 'Resting',
          meditating: state === 'Meditating',
        };

        this.eventBus.emit('new-statline-update', statlineUpdate);
        // actually not positive we want to clear this, but working for now
        this.incompleteLineBuffer = '';
      }
    }

    const parsedSpans = lines.map((line) => parse(line));

    const filteredSpans = parsedSpans.map((line) => {
      const realSpans = [];
      const statlineSpans = [];
      //filter out spans that contain statline info or ONLY ansi info
      if (line.spans && line.spans.length > 0) {
        line.spans.forEach((span) => {
          if (
            span.text === ']:' ||
            span.text.includes('[HP=') ||
            span.text.includes('/MA=') ||
            span.text === '\u001b[79D\u001b[K' ||
            span.text === ']:\u001b[79D\u001b[K' ||
            span.text === ']: (Resting) ' ||
            span.text === ']: (Meditating) '
          ) {
            // not doing anything with these right now
            // since the most recent statline will always(?) be part of the incompleteLineBuffer
            // so i believe these should all be old/irrelevant
            statlineSpans.push(span);
            return false;
          }
          // thesse are normally stripped away by the above, but sometimes these
          // remain if the line color is the same as the default color
          span.text = span.text.replace(']:', '');
          span.text = span.text.replace('(Resting)', '');
          span.text = span.text.replace('(Meditating)', '');
          // span.text = span.text.trim();
          realSpans.push(span);
        });
        line.spans = realSpans;
      }
      return line;
    });

    this.processMessage(filteredSpans);
  };

  processMessage = (messages) => {
    const timestamp = Date.now(); // Get current timestamp
    const lines = messages.flatMap((msg) => {
      if (msg && msg.spans && msg.spans.length > 0) {
        const strippedSpans = msg.spans.map((x) => x.text.stripAnsi());
        const line = strippedSpans.join('');
        this.eventBus.emit('new-message-line', {
          line: line,
          message: msg,
          timestamp: timestamp, // Add timestamp to the event
        });
        return line;
      }
      return [];
    });

    // Process the entire message for the 'who' command output or similar
    this.eventBus.emit('new-message-batch', {
      lines: lines,
      messages: messages,
      timestamp: timestamp, // Add timestamp to the batch event as well
    });
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

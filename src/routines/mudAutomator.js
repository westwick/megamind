import playerStats from "../state/playerStats";
import { strip, parse } from "ansicolor";
import RoomHandler from "../handlers/roomHandler";
import ConversationHandler from "../handlers/conversationHandler";
import RealmHandler from "../handlers/realmHandler";

export class MudAutomator {
  constructor(telnetSocket, gameState, playerStats, eventBus) {
    console.log("MudAutomator started");
    this.telnetSocket = telnetSocket;
    this.gameState = gameState;
    this.playerStats = playerStats;
    this.rawDataBuffer = [];
    this.maxRawDataBufferSize = 10; // Store last 10 raw data chunks
    this.incompleteLineBuffer = "";
    this.startStatsUpdateInterval();
    this.eventBus = eventBus;
    this.roomHandler = new RoomHandler(this.eventBus);
    this.conversationHandler = new ConversationHandler(this.eventBus);
    this.realmHandler = new RealmHandler(this.eventBus);
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
    this.incompleteLineBuffer = "";

    // Split the data into lines
    const lines = fullData.split("\r\n");

    // If the last line is incomplete, store it for the next chunk
    if (!fullData.endsWith("\r\n")) {
      this.incompleteLineBuffer = lines.pop();
    }

    const parsedSpans = lines.map((line) => parse(line));
    this.processMessage(parsedSpans);
  };

  processMessage = (messages) => {
    const lines = messages.flatMap((msg) => {
      if (msg && msg.spans && msg.spans.length > 0) {
        const strippedSpans = msg.spans.map((x) => strip(x.text));
        const line = strippedSpans.join("");
        this.eventBus.emit("new-message-line", {
          line: line,
          message: msg,
        });
        return line;
      }
      return [];
    });

    // Process the entire message for the 'who' command output or similar
    this.eventBus.emit("new-message-batch", {
      lines: lines,
      messages: messages,
    });
  };

  handleExperienceGain = (line) => {
    const match = line.match(/You gain (\d+) experience\./);
    if (match) {
      const expGained = parseInt(match[1], 10);
      playerStats.addExperience(expGained);
      console.log(`Gained ${expGained} experience`);

      // Notify the renderer about the updated experience
      this.updatePlayerStats();
    }
  };

  updatePlayerStats = () => {
    const stats = this.playerStats.getStats();
    this.eventBus.emit("update-player-stats", stats);
  };

  startStatsUpdateInterval = () => {
    // Update stats every 5 seconds
    setInterval(() => {
      this.updatePlayerStats();
    }, 5000);
  };

  // TODO: revise this to use the new parsed message system
  handleCombatState = (line) => {
    if (line.includes("[0;33m*Combat Engaged*")) {
      this.gameState.inCombat = true;
      console.log("Entered combat state");
    } else if (line.includes("[0;33m*Combat Off*")) {
      this.gameState.inCombat = false;
      console.log("Exited combat state");
    }
  };

  // TODO: revise this to use the new parsed message system
  handleEntityEnteringRoom = (line) => {
    const match = line.match(/\[1;33m(.*?)\[0;32m/);
    if (match) {
      let entityName = this.stripAnsi(match[1].trim());
      // Remove "A " or "An " from the beginning if present
      entityName = entityName.replace(/^(A|An)\s+/i, "");
      // Remove any trailing characters (like periods or escape codes)
      entityName = entityName.replace(/[.\u001b].*$/, "");

      // instead of updating everything again, lets just look in the current room
      // and let the other room update handle the rest
      this.sendCommand("");
    }
  };

  isPlayer = (entityName) => {
    // Check if the entity name (or its first word) matches any online user
    const entityFirstName = entityName.split(" ")[0].toLowerCase();
    return this.gameState.onlineUsers.some(
      (user) =>
        user.toLowerCase() === entityFirstName ||
        user.toLowerCase().startsWith(entityFirstName)
    );
  };

  sendCommand = (command) => {
    this.telnetSocket.write(command + "\r");
  };

  stripAnsi = (str) => {
    return str.replace(/\u001b\[[0-9;]*m/g, "").replace(/\.$/, "");
  };
}

export default MudAutomator;

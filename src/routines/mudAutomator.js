import playerStats from "../state/playerStats";
import { strip, parse } from "ansicolor";
import RoomHandler from "../handlers/roomHandler";
import ConversationHandler from "../handlers/conversationHandler";
import RealmHandler from "../handlers/realmHandler";
import CombatHandler from "../handlers/combatHandler";
import HealthHandler from "../handlers/healthHandler";
import CommandManager from "./commandManager";

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
    this.commandManager = new CommandManager(this.telnetSocket);

    this.roomHandler = new RoomHandler(this.eventBus, this.commandManager);
    this.conversationHandler = new ConversationHandler(this.eventBus);
    this.realmHandler = new RealmHandler(this.eventBus);
    this.combatHandler = new CombatHandler(
      this.eventBus,
      this.commandManager,
      this.gameState,
      this.playerStats
    );
    this.healthHandler = new HealthHandler(
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

  sendCommand = (command) => {
    this.telnetSocket.write(command + "\r");
  };

  stripAnsi = (str) => {
    return str.replace(/\u001b\[[0-9;]*m/g, "").replace(/\.$/, "");
  };
}

export default MudAutomator;

const GameState = require("../gameState");
const playerStats = require("../playerStats");
const EventEmitter = require("events");
const { strip, parse } = require("ansicolor");
const RoomHandler = require("../handlers/roomHandler");

class MudAutomator {
  constructor(telnetSocket, debugCallback) {
    console.log("MudAutomator started");
    this.telnetSocket = telnetSocket;
    this.debugCallback = debugCallback;
    this.rawDataBuffer = [];
    this.maxRawDataBufferSize = 10; // Store last 10 raw data chunks
    this.incompleteLineBuffer = "";
    playerStats.startSession();
    this.startStatsUpdateInterval();
    this.eventBus = new EventEmitter();
    this.roomHandler = new RoomHandler(this.eventBus);
    this.gameState = new GameState(this.eventBus);
  }

  debug(info) {
    if (this.debugCallback) {
      this.debugCallback(info);
    }
  }

  parse(data) {
    const dataString = data.toString();

    // Store raw data
    this.rawDataBuffer.push(dataString.toString());
    if (this.rawDataBuffer.length > this.maxRawDataBufferSize) {
      this.rawDataBuffer.shift();
    }

    // Prepend any incomplete line from the previous chunk
    let fullData = this.incompleteLineBuffer + dataString.toString();
    this.incompleteLineBuffer = "";

    // Split the data into lines
    const lines = fullData.split("\r\n");

    // If the last line is incomplete, store it for the next chunk
    if (!fullData.endsWith("\r\n")) {
      this.incompleteLineBuffer = lines.pop();
    }

    const parsedSpans = [];
    lines.map((line) => parsedSpans.push(parse(line)));
    this.processMessage(parsedSpans);

    // Debug information
    this.debug({
      rawDataBufferLength: this.rawDataBuffer.length,
      incompleteLineBuffer: this.incompleteLineBuffer,
      lastProcessedLine: lines[lines.length - 1],
    });
  }

  processMessage(messages) {
    var lines = [];
    for (let msg of messages) {
      if (msg && msg.spans && msg.spans.length > 0) {
        var strippedSpans = msg.spans.map((x) => {
          var stripped = strip(x.text);
          return stripped; //.replace(/.\b|\b./g, "");
        });

        var line = strippedSpans.map((x) => x).join("");
        lines.push(line);
        this.eventBus.emit("new-message-line", {
          line: line,
          message: msg,
        });

        console.log("msg: " + line, msg);
      }
    }
    // Process the entire message for the 'who' command output or similar
    this.eventBus.emit("new-message-batch", {
      lines: lines,
      messages: messages,
    });
  }

  handleExperienceGain(line) {
    const match = line.match(/You gain (\d+) experience\./);
    if (match) {
      const expGained = parseInt(match[1], 10);
      playerStats.addExperience(expGained);
      console.log(`Gained ${expGained} experience`);

      // Notify the renderer about the updated experience
      this.updatePlayerStats();
    }
  }

  updatePlayerStats() {
    const stats = playerStats.getStats();
    this.eventBus.emit("update-player-stats", stats);
  }

  startStatsUpdateInterval() {
    // Update stats every 5 seconds
    setInterval(() => {
      this.updatePlayerStats();
    }, 5000);
  }

  handleCombatState(line) {
    if (line.includes("[0;33m*Combat Engaged*")) {
      gameState.inCombat = true;
      console.log("Entered combat state");
    } else if (line.includes("[0;33m*Combat Off*")) {
      gameState.inCombat = false;
      console.log("Exited combat state");
    }
  }

  handleEntityEnteringRoom(line) {
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

      // if (!gameState.currentRoom.entities.includes(entityName)) {
      //   gameState.currentRoom.entities.push(entityName);
      //   console.log(`New entity entered the room: ${entityName}`);

      //   // If not in combat, attempt to attack the new entity if it's not a player
      //   if (!gameState.inCombat && !this.isPlayer(entityName)) {
      //     this.sendCommand(`attack ${entityName}`);
      //     console.log(`Attempting to attack: ${entityName}`);
      //   }

      //   // Notify the renderer about the updated room state
      //   this.eventBus.emit("update-room", gameState.currentRoom);
      // }
    }
  }

  isPlayer(entityName) {
    // Check if the entity name (or its first word) matches any online user
    const entityFirstName = entityName.split(" ")[0].toLowerCase();
    return gameState.onlineUsers.some(
      (user) =>
        user.toLowerCase() === entityFirstName ||
        user.toLowerCase().startsWith(entityFirstName)
    );
  }

  sendCommand(command) {
    this.telnetSocket.write(Buffer.from(command + "\r", "utf8"));
  }

  // Add this new method to the class
  stripAnsi(str) {
    return str.replace(/\u001b\[[0-9;]*m/g, "").replace(/\.$/, "");
  }

  handleWhoCommand(message) {
    if (
      message.includes(
        "[1;30m=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
      )
    ) {
      const lines = message.split("\n");
      const userLines = lines.slice(1, -1); // Remove the first and last lines (separators)

      const onlineUsers = userLines
        .map((line) => {
          const match = line.match(/\[32m([^\s]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean); // Remove any null values

      gameState.updateOnlineUsers(onlineUsers);
      console.log("Updated online users:", onlineUsers);

      // Notify the event bus about the updated online users
      this.eventBus.emit("update-online-users", onlineUsers);
    }
  }
}

module.exports = MudAutomator;

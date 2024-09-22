const gameState = require("../gameState");
const playerStats = require("../playerStats");
const { ipcRenderer } = require("electron");
const { strip, parse } = require("ansicolor");

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
        ipcRenderer.send("new-message-line", {
          line: line,
          message: msg,
        });

        console.log("msg: " + line, msg);
      }
    }
    // Process the entire message for the 'who' command output or similar
    ipcRenderer.send("new-message-batch", { lines: lines, messages: messages });
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
    ipcRenderer.send("update-player-stats", stats);
  }

  startStatsUpdateInterval() {
    // Update stats every 5 seconds
    setInterval(() => {
      this.updatePlayerStats();
    }, 5000);
  }

  /*
   "spans": [
          {
            "code": {
              "value": 1,
              "type": "style",
              "subtype": "bright",
              "str": "\u001b[1m",
              "isBrightness": true
            },
            "text": "\u001b[79D\u001b[K",
            "css": "",
            "bold": false,
            "inverse": false,
            "italic": false,
            "underline": false,
            "bright": false,
            "dim": false
          },
          {
            "code": {
              "str": "",
              "isBrightness": false
            },
            "text": "Darkwood Forest, Webbed Clearing\r",
            "css": "font-weight: bold;color:rgba(0,204,255,1);",
            "color": {
              "name": "cyan",
              "bright": true,
              "dim": false
            },
            "bold": true,
            "inverse": false,
            "italic": false,
            "underline": false,
            "bright": false,
            "dim": false
          }
        ]
      },
  */
  updateRoomName(line) {
    // Update room name
    if (
      line.spans &&
      line.spans.length == 2 &&
      line.spans[1].color &&
      line.spans[1].color.bright &&
      line.spans[1].color.name === "cyan"
    ) {
      console.log("Potential Room Name:", line.spans[1].text);

      ipcRenderer.send("new-room-name", line.spans[1].text);
    }
    /*
    // Handle items in the room
    if (line.includes("[0;36mYou notice")) {
      // Dark teal color for items
      const itemsPart = line.split("You notice")[1].trim();
      const items = itemsPart
        .split(",")
        .map((item) => item.trim().replace(/ here\.$/, ""));
      gameState.currentRoom.items = items;
      console.log("Items in room:", items);
    }

    // Handle monsters and players in the room
    if (line.includes("[0;35mAlso here:")) {
      const entitiesPart = line.split("Also here:")[1].trim();
      const entities = entitiesPart
        .split(",")
        .map((entity) => this.stripAnsi(entity.trim()))
        .filter((entity) => entity !== "");
      gameState.currentRoom.entities = entities;
      console.log("Entities in room:", entities);

      // Attempt to attack the first non-player entity if not already in combat
      if (entities.length > 0 && !gameState.inCombat) {
        const targetEntity = entities.find((entity) => !this.isPlayer(entity));
        if (targetEntity) {
          this.sendCommand(`attack ${targetEntity}`);
          console.log(`Attempting to attack: ${targetEntity}`);
        }
      }
    }

    // Handle "Obvious exits" information
    if (line.includes("[0;32mObvious exits:")) {
      // Dark green color for exits
      const exitsPart = line.split(":")[1];
      if (exitsPart) {
        const exits = exitsPart
          .trim()
          .split(",")
          .map((exit) => exit.trim())
          .map((exit) => exit.replace(/[A-Z]\b./g, "")); // Remove uppercase letter, backspace, and following character
        console.log("Obvious exits:", exits);
        gameState.currentRoom.exits = exits;

        // Validate and set the room name
        if (this.potentialRoomName) {
          gameState.currentRoom.name = this.potentialRoomName;
          console.log("Room Name confirmed:", this.potentialRoomName);
          this.potentialRoomName = null; // Reset after confirming
        }
      }

      ipcRenderer.send("update-room", gameState.currentRoom);
    }
*/
    // Add more conditions for other room information (map number, room number)
    // based on their specific ANSI color codes or patterns
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
      //   ipcRenderer.send("update-room", gameState.currentRoom);
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

      // Notify the renderer about the updated online users
      ipcRenderer.send("update-online-users", onlineUsers);
    }
  }
}

module.exports = MudAutomator;

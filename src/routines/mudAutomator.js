const gameState = require("../gameState");
const { ipcRenderer } = require("electron");

class MudAutomator {
  constructor(telnetSocket, debugCallback) {
    console.log("MudAutomator started");
    this.telnetSocket = telnetSocket;
    this.debugCallback = debugCallback;
    this.rawDataBuffer = [];
    this.messageBuffer = "";
    this.splitPattern = "[79D\u001b[K\u001b[0;37m[HP=";
    this.maxRawDataBufferSize = 10; // Store last 10 raw data chunks
    this.potentialRoomName = null;
  }

  debug(info) {
    if (this.debugCallback) {
      this.debugCallback(info);
    }
  }

  parse(data) {
    console.log("data received:", data.toString());

    // Store raw data
    this.rawDataBuffer.push(data.toString());
    if (this.rawDataBuffer.length > this.maxRawDataBufferSize) {
      this.rawDataBuffer.shift();
    }

    // Process the data
    this.messageBuffer += data.toString();
    const parts = this.messageBuffer.split(this.splitPattern);

    // Process all complete messages
    while (parts.length > 1) {
      const completeMessage = parts.shift();
      this.processMessage(completeMessage);
    }

    // Keep the last (potentially incomplete) part in the buffer
    this.messageBuffer = parts[0];

    // Debug information
    this.debug({
      rawDataBufferLength: this.rawDataBuffer.length,
      messageBufferLength: this.messageBuffer.length,
      lastProcessedMessage: parts[0],
    });
  }

  processMessage(message) {
    const lines = message.split("\n");
    for (let line of lines) {
      if (line.trim()) {
        this.handleMUDCommands(line);
        this.updateRoomInfo(line);
        this.handleCombatState(line);
        this.handleEntityEnteringRoom(line);
      }
    }
  }

  handleMUDCommands(line) {
    // Add MUD-specific command handling here
    // For example:
    if (line.includes("You are hungry")) {
      this.sendCommand("eat food");
    }
  }

  updateRoomInfo(line) {
    // Update room name
    if (line.includes("[1;36m")) {
      // Bright teal color for room name
      this.potentialRoomName = line.split("[1;36m")[1].split("[0m")[0].trim();
      console.log("Potential Room Name:", this.potentialRoomName);
      // Reset items and monsters when entering a new room
      gameState.currentRoom.items = [];
      gameState.currentRoom.entities = [];
    }

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

      // Attempt to attack the first entity if not already in combat
      if (entities.length > 0 && !gameState.inCombat) {
        const targetEntity = entities[0];
        this.sendCommand(`attack ${targetEntity}`);
        console.log(`Attempting to attack: ${targetEntity}`);
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

      gameState.currentRoom.entities.push(entityName);
      console.log(`New entity entered the room: ${entityName}`);

      // If not in combat, attempt to attack the new entity
      if (!gameState.inCombat) {
        this.sendCommand(`attack ${entityName}`);
        console.log(`Attempting to attack: ${entityName}`);
      }

      // Notify the renderer about the updated room state
      ipcRenderer.send("update-room", gameState.currentRoom);
    }
  }

  sendCommand(command) {
    this.telnetSocket.write(Buffer.from(command + "\r", "utf8"));
  }

  // Add this new method to the class
  stripAnsi(str) {
    return str.replace(/\u001b\[[0-9;]*m/g, "").replace(/\.$/, "");
  }
}

module.exports = MudAutomator;

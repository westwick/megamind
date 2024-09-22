class RoomHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.eventBus.on("new-message-line", (event) => {
      try {
        console.log(event);
        this.updateRoomName(event.message);
      } catch (error) {
        console.error("[roomHandler] Error processing line:", error);
      }
    });
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

      this.eventBus.emit("new-room-name", line.spans[1].text);
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
}

module.exports = RoomHandler;

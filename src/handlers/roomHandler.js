class RoomHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.potentialRoomName = null;
    // TODO -- add an event subscription to outbound commands to check
    //   and set state for when we are looking into another room
    this.eventBus.on("new-room-name", (roomName) => {
      this.potentialRoomName = roomName;
    });

    this.eventBus.on("new-room-items", (items) => {
      this.potentialRoomItems = items;
    });

    this.eventBus.on("new-room-entities", (entities) => {
      this.potentialRoomEntities = entities;
    });

    this.eventBus.on("new-room-exits", (exits) => {
      if (this.potentialRoomName) {
        const roomEvent = {
          roomName: this.potentialRoomName,
          items: this.potentialRoomItems,
          entities: this.potentialRoomEntities,
          exits: exits,
        };
        console.log("[roomHandler] new room", roomEvent);
        this.eventBus.emit("new-room", roomEvent);
        this.potentialRoomName = null;
        this.potentialRoomItems = null;
        this.potentialRoomEntities = null;
      }
    });

    this.eventBus.on("new-message-line", (event) => {
      try {
        console.log(event);
        this.updateRoomName(event.message);
        this.updateRoomItems(event);
        this.updateRoomEntities(event);
        this.updateRoomExits(event.message);
      } catch (error) {
        console.error("[roomHandler] Error processing line:", error);
      }
    });
  }

  /*
  {
    "spans": [
        {
            "code": {
                "str": "",
                "isBrightness": false
            },
            "text": "Obvious exits: nF\borth, wU\best",
            "css": "color:rgba(0,204,0,1);",
            "color": {
                "name": "green",
                "bright": false,
                "dim": false
            },
            "bold": false,
            "inverse": false,
            "italic": false,
            "underline": false,
            "bright": false,
            "dim": false
        }
    ]
} */
  updateRoomExits(message) {
    if (
      message.spans &&
      message.spans.length == 1 &&
      message.spans[0].color &&
      message.spans[0].color.name == "green"
    ) {
      const exitString = message.spans[0].text.replace(/[A-Z]\b./g, "");
      const exitsPart = exitString.split(":")[1];
      if (exitsPart) {
        const exits = exitsPart
          .trim()
          .split(",")
          .map((exit) => exit.trim());
        console.log("[roomHandler] Obvious exits:", exits);
        this.eventBus.emit("new-room-exits", exits);
      }
    }
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
  updateRoomName(message) {
    // Update room name
    if (
      message.spans &&
      message.spans.length == 2 &&
      message.spans[1].color &&
      message.spans[1].color.bright &&
      message.spans[1].color.name === "cyan"
    ) {
      console.log("Potential Room Name:", message.spans[1].text);

      this.eventBus.emit("new-room-name", message.spans[1].text);
    }
  }

  /* {
    "spans": [
        {
            "code": {
                "str": "",
                "isBrightness": false
            },
            "text": "You notice black star key here.",
            "css": "color:rgba(0,153,255,1);",
            "color": {
                "name": "cyan",
                "bright": false,
                "dim": false
            },
            "bold": false,
            "inverse": false,
            "italic": false,
            "underline": false,
            "bright": false,
            "dim": false
        }
    ]
}*/
  updateRoomItems(event) {
    const message = event.message;
    if (
      message.spans &&
      message.spans[0].color &&
      message.spans[0].color.name == "cyan" &&
      event.line.startsWith("You notice")
    ) {
      const itemsPart = event.line.split("You notice")[1].trim();
      const items = itemsPart
        .split(",")
        .map((item) => item.trim().replace(/ here\.$/, ""));
      console.log("[roomHandler] Items in room:", items);
      this.eventBus.emit("new-room-items", items);
    }
  }

  /* {
    "spans": [
        {
            "code": {
                "value": 1,
                "type": "style",
                "subtype": "bright",
                "str": "\u001b[1m",
                "isBrightness": true
            },
            "text": "Also here: ",
            "css": "color:rgba(204,0,204,1);",
            "color": {
                "name": "magenta",
                "bright": false,
                "dim": false
            },
            "bold": false,
            "inverse": false,
            "italic": false,
            "underline": false,
            "bright": false,
            "dim": false
        },
        {
            "code": {
                "value": 0,
                "type": "style",
                "subtype": "",
                "str": "\u001b[0m",
                "isBrightness": false
            },
            "text": "forest spider",
            "css": "font-weight: bold;color:rgba(255,0,255,1);",
            "color": {
                "name": "magenta",
                "bright": true,
                "dim": false
            },
            "bold": true,
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
            "text": ".",
            "css": "color:rgba(204,0,204,1);",
            "color": {
                "name": "magenta",
                "bright": false,
                "dim": false
            },
            "bold": false,
            "inverse": false,
            "italic": false,
            "underline": false,
            "bright": false,
            "dim": false
        }
    ]
}
    */
  updateRoomEntities(event) {
    if (
      event.message.spans &&
      event.message.spans[0].color &&
      event.message.spans[0].color.name == "magenta"
    ) {
      const entitiesPart = event.line.split("Also here:")[1].trim();

      const entities = entitiesPart
        .split(",")
        .filter((entity) => entity !== "");

      // TODO - fix trailing period in entities
      console.log("[roomHandler] Entities in room:", entities);
      this.eventBus.emit("new-room-entities", entities);
    }
  }
  /* TODO: find a new home for this, prob a gameState event subscription
    
          // Attempt to attack the first non-player entity if not already in combat
          if (entities.length > 0 && !gameState.inCombat) {
            const targetEntity = entities.find((entity) => !this.isPlayer(entity));
            if (targetEntity) {
              this.sendCommand(`attack ${targetEntity}`);
              console.log(`Attempting to attack: ${targetEntity}`);
            }
          }
        } */
}

module.exports = RoomHandler;

const readJsonLinesFile = require("./dataImport");

class Room {
  constructor(data) {
    this.Id = data["Map Number"] + "/" + data["Room Number"];
    this.MapNumber = data["Map Number"];
    this.RoomNumber = data["Room Number"];
    this.Name = data.Name;
    this.Exits = {
      N: parseExit(data.N),
      S: parseExit(data.S),
      E: parseExit(data.E),
      W: parseExit(data.W),
      NE: parseExit(data.NE),
      NW: parseExit(data.NW),
      SE: parseExit(data.SE),
      SW: parseExit(data.SW),
      U: parseExit(data.U),
      D: parseExit(data.D),
    };

    // uncomment this to see all the data but dont leave it checked in to save memory
    //Object.assign(this, data);
  }
}

function parseExit(exit) {
  if (exit === "0") {
    return {};
  }
  const exitParts = exit.split(" ");
  const hasDoor = exitParts.length > 1;
  const [mapNumber, roomNumber] = exitParts[0].split("/");

  return { MapNumber: mapNumber, RoomNumber: roomNumber, Door: hasDoor };
}

class RoomLookup {
  constructor() {
    this.rooms = {};
    this.mapRoomToId = {};
    this.nameToMapRoom = {};
  }

  async loadRooms(filepath) {
    const roomData = await readJsonLinesFile(filepath);
    roomData.forEach((data) => {
      const room = new Room(data);
      this.rooms[data["Map Number"] + "/" + data["Room Number"]] = room;

      if (!this.mapRoomToId[data["Map Number"]]) {
        this.mapRoomToId[data["Map Number"]] = {};
      }
      this.mapRoomToId[data["Map Number"]][data["Room Number"]] =
        data["Map Number"] + "/" + data["Room Number"];

      if (!this.nameToMapRoom[data.Name]) {
        this.nameToMapRoom[data.Name] = [];
      }
      this.nameToMapRoom[data.Name].push({
        RoomId: data["Map Number"] + "/" + data["Room Number"],
        MapNumber: data["Map Number"],
        RoomNumber: data["Room Number"],
      });
    });
  }

  getRoomById(id) {
    return this.rooms[id] || null;
  }

  getRoomByMapAndNumber(mapNumber, roomNumber) {
    const id = this.mapRoomToId[mapNumber]?.[roomNumber];
    return id ? this.rooms[id] : null;
  }

  getRoomsByName(name) {
    return this.nameToMapRoom[name] || [];
  }
}

module.exports = { Room, RoomLookup };

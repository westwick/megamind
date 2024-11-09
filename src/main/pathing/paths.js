import { RoomLookup } from "../data/rooms.js";

class Pathfinding {
  constructor(roomLookup) {
    this.roomLookup = roomLookup;
  }

  findShortestPath(startRoomId, endRoomId) {
    if (startRoomId === endRoomId) return [startRoomId];

    const queue = [[startRoomId]];
    const visited = new Set();

    while (queue.length > 0) {
      const path = queue.shift();
      const roomId = path[path.length - 1];

      if (visited.has(roomId)) continue;
      visited.add(roomId);

      const room = this.roomLookup.getRoomById(roomId);
      if (!room) continue;

      for (const direction in room.Exits) {
        const exit = room.Exits[direction];
        if (exit.MapNumber && exit.RoomNumber) {
          const nextRoomId = `${exit.MapNumber}/${exit.RoomNumber}`;
          const newPath = [...path, nextRoomId];

          if (nextRoomId === endRoomId) {
            return newPath;
          }

          queue.push(newPath);
        }
      }
    }

    return null; // No path found
  }
}

export { Pathfinding };

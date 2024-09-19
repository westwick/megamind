console.log("Map.js is starting to execute");

const { ipcRenderer } = require("electron");

console.log("Electron ipcRenderer loaded");

console.log("Map.js loaded");

// DOM elements
const roomName = document.getElementById("room-name");
const roomExits = document.getElementById("room-exits");
const mapNumber = document.getElementById("map-number");
const roomNumber = document.getElementById("room-number");

console.log("DOM elements:", { roomName, roomExits, mapNumber, roomNumber });

// Listen for room updates from the main process
ipcRenderer.on("update-room", (event, room) => {
  console.log("Received update-room event:", room);
  try {
    roomName.textContent = room.name || "N/A";
    roomExits.textContent = room.exits ? room.exits.join(", ") : "N/A";
    mapNumber.textContent = room.mapNumber || "N/A";
    roomNumber.textContent = room.roomNumber || "N/A";

    updateMap(room);
  } catch (error) {
    console.error("Error updating room info:", error);
  }
});

function updateMap(room) {
  console.log("Updating map with room info:", room);
  // Implement map rendering logic here
}

// Modify the testUpdate function
window.testUpdate = function () {
  console.log("testUpdate function called");
  const testRoom = {
    name: "Test Room",
    exits: ["north", "south"],
    mapNumber: "1",
    roomNumber: "101",
  };
  console.log("Sending test-update-room event", testRoom);
  ipcRenderer.send("test-update-room", testRoom);
};

// Listen for the test update
ipcRenderer.on("test-update-room", (event, room) => {
  console.log("Received test update:", room);
  ipcRenderer.emit("update-room", event, room);
});

console.log("Map.js setup complete");

console.log(
  "Map.js finished loading, testUpdate function is",
  window.testUpdate
);

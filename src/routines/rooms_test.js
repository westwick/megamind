const readJsonLinesFile = require("./dataImport");
const path = require("path");
const { RoomLookup } = require("./rooms");

/* sample data
{
  'Map Number': 1,
  'Room Number': 1,
  Name: 'Town Gates',
  Light: 0,
  Shop: 0,
  NPC: 0,
  CMD: 0,
  Spell: 0,
  N: '1/3',
  S: '1/100',
  E: '1/1381 (Door)',
  W: '1/101',
  NE: '0',
  NW: '0',
  SE: '0',
  SW: '0',
  U: '0',
  D: '0'
}
{
  'Map Number': 2,
  'Room Number': 1,
  Name: 'Mountain Stair',
  Light: 0,
  Shop: 0,
  NPC: 0,
  CMD: 0,
  Spell: 0,
  N: '2/2',
  S: '0',
  E: '0',
  W: '0',
  NE: '0',
  NW: '0',
  SE: '0',
  SW: '0',
  U: '0',
  D: '10/16'
}
{
  'Map Number': 3,
  'Room Number': 1,
  Name: 'Mossy Cave, Waterfall',
  Light: -175,
  Shop: 0,
  NPC: 0,
  CMD: 0,
  Spell: 0,
  N: '0',
  S: '0',
  E: '3/2',
  W: '0',
  NE: '0',
  NW: '0',
  SE: '0',
  SW: '0',
  U: '0',
  D: '1/2362'
}
{
  'Map Number': 4,
  'Room Number': 1,
  Name: 'Silvermere Property Office',
  Light: 0,
  Shop: 181,
  NPC: 0,
  CMD: 0,
  Spell: 0,
  N: '0',
  S: '0',
  E: '0',
  W: '1/219',
  NE: '0',
  NW: '0',
  SE: '0',
  SW: '0',
  U: '0',
  D: '0'
}
{
  'Map Number': 5,
  'Room Number': 1,
  Name: 'Tournament Arena',
  Light: 0,
  Shop: 0,
  NPC: 0,
  CMD: 0,
  Spell: 0,
  N: '5/2',
  S: '0',
  E: '0',
  W: '0',
  NE: '0',
  NW: '0',
  SE: '0',
  SW: '0',
  U: '0',
  D: '0'
}
*/

async function main() {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "rooms-v1.11p.json.gz"
  );
  const roomData = await readJsonLinesFile(filePath);

  console.log("Reading file:", filePath);

  // Read and print the first 5 items
  console.log("\nFirst 5 items:");
  roomData.slice(0, 5).forEach((item) => {
    console.log(item);
  });

  // Count total number of items
  console.log("\nTotal items:", roomData.length);

  // Validate loadRooms
  const roomLookup = new RoomLookup();
  await roomLookup.loadRooms(filePath);

  // Test getRoomById
  const testRoomId =
    roomData[0]["Map Number"] + "/" + roomData[0]["Room Number"];
  const roomById = roomLookup.getRoomById(testRoomId);
  console.log("\nTest getRoomById:");
  console.log(roomById);

  // Test getRoomByMapAndNumber
  const testMapNumber = roomData[0]["Map Number"];
  const testRoomNumber = roomData[0]["Room Number"];
  const roomByMapAndNumber = roomLookup.getRoomByMapAndNumber(
    testMapNumber,
    testRoomNumber
  );
  console.log("\nTest getRoomByMapAndNumber:");
  console.log(roomByMapAndNumber);

  // Test getRoomsByName
  const testName = roomData[0].Name;
  const roomsByName = roomLookup.getRoomsByName(testName);
  console.log("\nTest getRoomsByName:");
  console.log(roomsByName);
}

main().catch(console.error);

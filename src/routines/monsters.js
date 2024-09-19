const path = require("path");
const readJsonLinesFile = require("./dataImport");

class MonsterLookup {
  constructor(filepath) {
    this.monsters = {};
    this.loadMonsters(filepath);
  }

  loadMonsters(filepath) {
    const monsterData = readJsonLinesFile(filepath);
    monsterData.forEach((monster) => {
      this.monsters[monster.id] = monster;
    });
  }

  getMonster(id) {
    return this.monsters[id] || null;
  }
}

// Export the MonsterLookup class
module.exports = MonsterLookup;

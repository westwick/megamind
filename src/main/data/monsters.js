import readJsonLinesFile from "./dataImport.js";

class Monster {
  constructor(data) {
    this.Align = data.Align;
    this.Name = data.Name;
    this.Id = data.Id;

    // uncomment this to see all the data but dont leave it checked in to save memory
    //Object.assign(this, data);
  }

  get alignment() {
    switch (this.Align) {
      case 0:
        return "Good";
      case 1:
        return "Evil";
      case 2:
        return "Chaotic Evil";
      case 3:
        return "Neutral";
      case 4:
        return "Lawful Good";
      case 5:
        return "Neutral Evil";
      case 6:
        return "Lawful Evil";
      default:
        return "Unknown";
    }
  }
}

class MonsterLookup {
  constructor(filepath) {
    this.monsters = {};
    this.nameToIdMap = {};
    this.loadMonsters(filepath);
  }

  loadMonsters(filepath) {
    const monsterData = readJsonLinesFile(filepath);
    monsterData.forEach((data) => {
      const monster = new Monster(data);
      this.monsters[data.id] = monster;
      this.nameToIdMap[data.Name.toLowerCase()] = data.id;
    });
  }

  getMonsterById(id) {
    return this.monsters[id] || null;
  }

  getMonsterByName(name) {
    const id = this.nameToIdMap[name.toLowerCase()];
    return id ? this.monsters[id] : null;
  }
}

export { Monster, MonsterLookup };

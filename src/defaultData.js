import RealmData from "./entities/realmData.js";

let realm = await RealmData.defaultData();
await realm.close();
realm = null;

process.exit(0);

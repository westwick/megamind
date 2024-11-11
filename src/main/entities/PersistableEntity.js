import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import lockfile from 'proper-lockfile';

import DocumentData from './DocumentData.js';

import '../util/Extensions.js';
import PersistableProperty from './PersistableProperty.js';
import Configuration from '../state/Configuration.js';

export default class PersistableEntity {
  static _config = new Configuration('megamind.yaml');
  static _datastores = {};

  _document = {};
  _id = new PersistableProperty();

  get config() {
    return this.constructor._config;
  }

  static get config() {
    return this._config;
  }

  static get entityName() {
    return this.name;
  }

  get entityName() {
    return this.constructor.name;
  }

  get document() {
    return this._document;
  }

  set document(value) {
    this._document = this.database.set(this._id, value);
  }

  constructor() {
    const stack = new Error().stack;
    if (!stack.includes('.create')) {
      throw new Error('PersistableEntity constructor cannot be called directly. Use static create() method instead.');
    }
  }

  static async create(key, ...args) {
    let url = args.find((arg) => typeof arg === 'string') || '/';
    let initialValues = args.find((arg) => typeof arg === 'object') || {};

    const entity = new this();

    entity.url = url;
    entity.entity = this.entityName;
    entity.file = this.databaseFile(entity.url, entity.entity);
    entity.database = await this.getDatabaseInstance(entity.entity, entity.url);
    entity.dirty = false;

    // create the PersistableProperty which turns it into a getter/setter
    Object.keys(entity).forEach((key) => {
      if (entity[key] instanceof PersistableProperty) {
        entity.persist(key);
      }
    });

    const existing = entity.database.get(key);

    if (existing) {
      entity._document = existing; // skip the setter which increments the version
    } else {
      entity.document = { _id: key }; // create and add metadata
    }

    if (Object.keys(initialValues).length > 0) {
      entity.setProperties(initialValues);
    }

    return entity;
  }

  static async createAll(entities, url = '/') {
    return await Promise.all(entities.map(async (entity) => this.create(entity._id, url, entity)));
  }

  static setPersistableProperties(entity) {
    Object.keys(entity).forEach((key) => {
      if (entity[key] instanceof PersistableProperty) {
        entity.persist(key);
      }
    });
  }

  static databaseFile(url = '/', name) {
    const defaultPath = path.join(dirname(fileURLToPath(import.meta.url)), 'resources/state');

    const dbPath = this.config.paths?.data || defaultPath;
    const dbFile = path.join(dbPath, url, `${name.pluralize()}.json`);

    if (!fs.existsSync(dirname(dbFile))) {
      fs.mkdirSync(dirname(dbFile), { recursive: true });
    }

    return dbFile;
  }

  static _initializationPromises = {};

  static async getDatabaseInstance(name, url = '/') {
    const file = this.databaseFile(url, name);

    // Return existing datastore if available
    if (this._datastores[file]) {
      return this._datastores[file];
    }

    // If initialization is in progress, wait for it
    if (this._initializationPromises[file]) {
      return await this._initializationPromises[file];
    }

    // Create initialization promise for this file
    this._initializationPromises[file] = (async () => {
      console.log('creating initialization promise');
      try {
        // make sure the directory and file exists
        await fs.promises.mkdir(path.dirname(file), { recursive: true });

        try {
          await fs.promises.access(file);
        } catch (err) {
          await fs.promises.writeFile(file, '');
        }

        // lock the file
        console.log('locking file for database');
        const release = await lockfile.lock(file, {
          stale: 5000,
          update: 1000,
          retries: {
            forever: true,
            minTimeout: 100,
            maxTimeout: 1000,
          },
        });

        // Double-check pattern after acquiring lock
        if (!this._datastores[file]) {
          const doc = new DocumentData(file);
          const database = await doc.load(false); // we control the lock
          this._datastores[file] = database;
        }

        await release();
        return this._datastores[file];
      } finally {
        // Schedule cleanup for the next tick after promise resolves
        Promise.resolve().then(() => {
          console.log('deleting initialization promise');
          delete this._initializationPromises[file];
        });
      }
    })();

    console.log('returning initialization promise');
    return await this._initializationPromises[file];
  }

  remove() {
    this.document = { _id: this._id };
    this.database.delete(this._id);
  }

  static async exists(key, url = '/') {
    const database = await this.getDatabaseInstance(this.entityName, url);
    return database.has(key);
  }

  static async find(key, url = '/') {
    const database = await this.getDatabaseInstance(this.entityName, url);

    const record = database.get(key);

    if (record) {
      return await this.create(key, url, record);
    }

    return undefined;
  }

  static async resolve(key, ...paths) {
    // Search through each path in order
    for (const url of paths) {
      const database = await this.getDatabaseInstance(this.entityName, url);
      if (database.has(key)) {
        return await this.create(key, url);
      }
    }

    return undefined;
  }

  static async all(url = '/') {
    const database = await this.getDatabaseInstance(this.entityName, url);
    const records = database.all();

    if (records && records.length > 0) {
      return this.createAll(records, url);
    }

    return [];
  }

  static async clear(url = '/') {
    const database = await this.getDatabaseInstance(this.entityName, url);
    database.clear();
  }

  async deleteDatabase() {
    if (this.constructor._datastores[this.file]) {
      delete this.constructor._datastores[this.file];
    }

    await this.database.deleteDatabase();
  }

  static async deleteDatabase(url = '/') {
    const database = await this.getDatabaseInstance(this.entityName, url);
    database.deleteDatabase();
  }

  setProperties(values = {}) {
    Object.keys(values)
      .filter((key) => key in this)
      .forEach((key) => {
        this[key] = values[key]; // Set the property to the value from args
      });
  }

  persist(name) {
    Object.defineProperty(this, name, {
      set(value) {
        // TODO; recursively check for changes if this is an array or object
        if (this._document[name] !== value) {
          this.dirty = true;
          this.database.changed(this._id);
          this._document[name] = value;
        }
      },
      get() {
        return this._document[name];
      },
    });
  }

  transaction() {
    this.inTransaction = true;
    this.backup = JSON.parse(JSON.stringify(this._document));
  }

  async save() {
    if (this.dirty) {
      console.log('SAVING:', this._document);
      if (this.config.debug.logCommits) {
        console.log('COMMIT:', this._document);
        if (this.config.debug.logCommitCallstack) {
          console.log('CALLSTACK:');
          console.log(new Error().stack.cleanStackTrace());
        }
      }

      //this.database.set(this._id, this._document);
      await this.database.save();
      this.dirty = false;
    }

    this.backup = undefined;
    return this;
  }

  rollback() {
    if (!this.inTransaction) {
      throw new Error('Cannot rollback outside of a transaction');
    }

    const copyValues = (target, source) => {
      Object.keys(source).forEach((key) => {
        if (typeof source[key] === 'object' && source[key] !== null) {
          target[key] = target[key] || {};
          copyValues(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    };

    copyValues(this._document, this.backup);

    this.inTransaction = false;
    this.backup = null;
    this.database.clearChange(this._id);
  }
}

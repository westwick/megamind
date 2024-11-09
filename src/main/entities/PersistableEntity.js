import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import Datastore from '@seald-io/nedb';

import "../util/Extensions.js";
import PersistableProperty from './PersistableProperty.js';
import Configuration from '../state/newConfig.js';

const config = new Configuration('megamind.yaml');

/**
 * Base class for Entities that allow persisting to NeDB storage
 * This is not meant to be used directly but only inherited.
 * 
 * Note: Entities are not persisted until the save() method is called which is done automatically
 * if the saveTimer is greater than 0.
 *
 * @template T
 * @class PersistableEntity
 * @example
 * class User extends PersistableEntity {
 *      IP = new PersistableProperty();
 *      FirstName = new PersistableProperty();
 * }
 * 
 * const user = await User.new('soul');
 * user.IP = '127.0.0.1'; // saves in one second unless
 * user.save(); // saves immediately
 * 
 * user.transaction();
 * try {
 *      user.IP = "24.40.92.105";
 *      user.FirstName = "Richard";
 *      // call external webservice which might throw an exception
 *      user.commit();
 * } catch (e) {
 *      console.log(e);
 *      user.rollback();
 * }
 * 
 */
export default class PersistableEntity {
    static datastore = {};
    
    _id = new PersistableProperty();

    set Key(value) { this._id = value; }
    get Key() { return this._id; } 

    constructor(init, saveTimer = 1000) {
        if (!init) {
            throw new Error(`Use static method .new() to create an instance of the ${this.constructor.name} entity.`);
        }
        
        if (saveTimer > 0) {
            this.saveTimer = setInterval(() => this.save(), saveTimer);
        }
    }
    static async new(key, ...args) {
        const initialValues = args.find(arg => typeof arg === 'object') || {};
        const inMemory = args.find(arg => typeof arg === 'boolean') || false;

        const entity = new this(true);
        entity.inMemory = inMemory;

        const database = await this.getDatabaseByName(this.name);
        database.setAutocompactionInterval(60 * 1000);

        entity.document = {};

        // create the PersistableProperty which turns it into a getter/setter
        Object.keys(entity).forEach(key => {
            if (entity[key] instanceof PersistableProperty) {
                entity.persist(key); // make PersistableProperty
            }
        });

        entity.changes = false;
        entity.inTransaction = false;
        entity.backup = undefined;
        entity.Key = key;
        entity.document = await database.findOneAsync({ _id: key }) || entity.document;
        
        if (Object.keys(initialValues).length > 0) {
            await this.setProperties(entity, initialValues);
        }

        return await entity.save();
    }
    
    async database() {
        return await PersistableEntity.getDatabaseByName(this.constructor.name);
    }

    static async database(name) {
        return await this.getDatabaseByName(name);
    }

    static async getDatabaseByName(name) {
        const filename = path.join(__dirname, '..', 'resources', name.pluralize() + '.db');

        if (!this.datastore[name]) {
            console.log('Initializing database:', filename);
        }

        return this.datastore[name] = this.datastore[name] || new Datastore({ filename, autoload: true });
    }

    static async defaultData(name) {
        const filename = path.join(__dirname, '..', 'resources', name.pluralize() + '.db');
        console.log('Wrote default data to:', filename);
    }

    persist(name) {
        Object.defineProperty(this, name, {
            set(value) {
                this.document[name] = value;
                this.changes = true;
            },
            get() {
                return this.document[name];
            }
        });
    }

    static async setProperties(entity, initialValues = {}) {
        entity.transaction();

        for (const key in initialValues) {
            if (!(key in entity)) {
                throw new Error(`Property '${key}' does not exist on '${entity.constructor.name}'.`);
            }

            entity[key] = initialValues[key];  // Set the property to the value from args
        }

        await entity.commit();
    }

    /**
     * @description Check if an entity exists by its key and return the instance if it does.
     * @param {string} value
     * @returns {Promise<PersistableEntity | null>}
     */
    static async exists(value) {
        const database = await this.getDatabaseByName(this.name);
        const doc = await database.findOneAsync({ _id: value });
        
        if (doc) {
            return await this.new(value, doc);
        }
        
        return null;
    }

    /**
     * @description Get all entities or a single entity by its key.
     * @param {string} value
     * @returns {Promise<PersistableEntity[]>}
     */
    static async all(value) {
        let match;

        const database = await this.getDatabaseByName(this.name);

        if (value) {
            match = await database.findAsync({ _id: value });
        } else {
            match = await database.findAsync();
        }
        
        return await Promise.all(match.map(async doc => await this.new(doc._id, doc)));
    }
    
    static async find(key) {
        const database = await this.getDatabaseByName(this.name);
        const doc = await database.findOneAsync({ _id: key });

        if (doc) {
            return await this.new(doc._id, doc);
        }
        
        return undefined;
    }
    
    async remove(value) {
        const database = await this.database();

        if (value) {
            return await database.removeAsync({ _id: value }, { multi: true });
        }

        return await database.removeAsync({}, { multi: true });
    }
    
    static async removeAll() {
        const database = await this.getDatabaseByName(this.name);
        return await database.removeAsync({}, { multi: true });
    }
    
    static async deleteDatabase() {
        fs.unlinkSync(path.join(__dirname, '..', 'resources', this.name.pluralize() + '.db'));
    }
    
    // PERSISTANCE/TRANSACTION
    
    clone() {
        this.backup = JSON.parse(JSON.stringify(this.document));
    }

    async save() {
        if (!this.inTransaction && this.changes) {
            // @ts-ignore
            if (config.debug.logCommits) console.log('COMMIT:', this.document);
            // @ts-ignore
            if (config.debug.logCommits && config.debug.logCommitCallstack) {
                console.log('CALLSTACK:');
                console.log(new Error().stack.cleanStackTrace());
            }

            this.changes = false;

            const database = await this.database();
            await database.updateAsync({ _id: this.Key }, this.document, { upsert: true });
        }
        
        return this;
    }
    
    transaction() {
        this.clone();
        this.inTransaction = true;
    }
    
    rollback() {
        this.document = JSON.parse(JSON.stringify(this.backup));
        this.backup = undefined;
        this.inTransaction = false;
    }

    async commit() {
        this.inTransaction = false;
        this.save();
    }
    
    async close() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
        }

        const database = await this.database();
        database.stopAutocompaction();
        await database.compactDatafileAsync();

        delete PersistableEntity.datastore[this.constructor.name];
    }
}
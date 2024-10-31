import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import Datastore from '@seald-io/nedb';
import "../util/Extensions.js";
import PersistableProperty from './PersistableProperty.js';
//import Configuration from '../Utilities/Configuration.js';

//const config = new Configuration('shift.yaml');

/**
 * Base class for Entities that allow persisting to NeDB storage
 * This is not meant to be used directly but only inherited.
 * @template T
 * @class PersistableEntity
 * @example
 * class User extends PersistableEntity {
 *      IP = new PersistableProperty();
 *      FirstName = new PersistableProperty();
 * }
 * 
 * const user = await User.new('soul');
 * user.IP = '127.0.0.1'; // persisted right away
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

    get Key() { return this.id; } 

    set Key(value) { 
        this.id = value;
        this.document['_id'] = value;
    }
    
    constructor(instance = false) {
        super();

        if (!instance) {
            throw new Error(`Use static method .new() to create an instance of the ${this.constructor.name} entity.`);
        }

        this.document = undefined;
        this.inTransaction = false;
    }
    
    get Database() {
        return PersistableEntity.datastore[this.constructor.name] ??= this.load(this.constructor.name);
    }
    
    load(name) {
        return new Datastore({
            filename: path.join(__dirname, '..', 'resources', name.pluralize() + '.db'),
            autoload: true
        });
    }

    static load(name) {
        return new Datastore({
            filename: path.join(__dirname, '..', 'resources', name.pluralize() + '.db'),
            autoload: true
        });
    }
    
    // any static calls in this class must call the static accessor passing in this.name
    static getDatabaseByName(name) {
        return PersistableEntity.datastore[name] ??= this.load(name);
    }

    persist(name) {
        Object.defineProperty(this, name, {
            set(value) {
                this.document[name] = value;
                this.save();
            },
            get() {
                return this.document[name];
            }
        });
    }
    
    static async new(key, initialValues = {}) {
        const entity = new this(true);

        entity.document = {};
        entity.backup = undefined;
        entity.Key = key;

        entity.Database.setAutocompactionInterval(60 * 1000);

        // create the PersistableProperty which turns it into a getter/setter
        Object.keys(entity).forEach(key => {
            if (entity[key] instanceof PersistableProperty) {
                entity.persist(key); // make PersistableProperty
            }
        });

        entity.document = await entity.find() || entity.document;
        
        if (Object.keys(initialValues).length > 0) {
            this.setProperties(entity, initialValues);
        }
        return entity;
    }
    
    static setProperties(entity, initialValues = {}) {
        entity.transaction();

        for (const key in initialValues) {
            if (!(key in entity)) {
                throw new Error(`Property '${key}' does not exist on '${entity.constructor.name}'.`);
            }

            entity.document[key] = initialValues[key];  // Set the property to the value from args
        }

        entity.commit();
    }

    static async exists(value) {
        return await PersistableEntity.getDatabaseByName(this.name).findOneAsync({ _id: value });
    }

    static async all(value) {
        if (value) {
            return await PersistableEntity.getDatabaseByName(this.name).findAsync({ _id: value });
        }
        return await PersistableEntity.getDatabaseByName(this.name).findAsync();
    }
    
    async find() {
        return await this.Database.findOneAsync({ _id: this.Key });
    }
    
    async remove() {
        return await this.Database.removeAsync({ _id: this.Key }, { multi: true });
    }
    
    // PERSISTANCE/TRANSACTION
    
    clone() {
        this.backup = JSON.parse(JSON.stringify(this.document));
    }

    async save() {
        if (!this.inTransaction) {
            // @ts-ignore
            //if (config.debug.logCommits) console.log('COMMIT:', this.document);
            // @ts-ignore
            //if (config.debug.logCommits && config.debug.logCommitCallstack) console.log('\n' + new Error().stack.cleanStackTrace());

            return await this.Database.updateAsync({ _id: this.Key }, this.document, { upsert: true });
        }
    }
    
    transaction() {
        this.clone();
        this.inTransaction = true;
    }
    
    rollback() {
        this.document = JSON.parse(JSON.stringify(this.backup));
        this.backup = undefined;
    }

    async commit() {
        this.inTransaction = false;
        this.save();
    }
}
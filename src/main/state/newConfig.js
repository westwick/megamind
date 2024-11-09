let app;

try {
  ({ app } = require('electron'));
} catch {
  app = null;
}

import fs from 'fs';
import yaml from 'yaml';
import process from 'process';
import Ajv from 'ajv';

import { dirname, resolve, join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

export default class Configuration {
  static #instances = new Map();

  #watcher;
  #options;

  static #defaultPaths = [
    app?.getAppPath(), // where the app is
    join(app?.getAppPath() || './', 'resources'), // where the resources are in the app folder
    dirname(process.argv[1]), // process.argv[1]
    resolve('.'), // ./
    join(homedir(), '.config', 'megamind'), // ~/.config/megamind/
    '/etc/megamind', // /etc/megamind/
    fileURLToPath(dirname(import.meta.url)), // module directory
    resolve(fileURLToPath(dirname(import.meta.url)), '../../../resources'), // module directory + '../resources'
  ];

  get options() {
    return this.#options;
  }

  /**
   * Create a new Configuration object
   * @param {string} filename - The name of the configuration file to load
   * @param {...*} args - Variable arguments that can include:
   * @param {string[]} [args.searchPaths] - Array of paths to search for config files
   * @param {string} [args.schemaFile] - Path to JSON schema file for validation
   * @param {Object} [args.replacements] - Key-value pairs for variable substitution
   * @param {Function} [args.loadCallback] - Called when config loads successfully
   * @param {Function} [args.errorCallback] - Called if an error occurs during loading
   * @returns {Proxy} A proxied Configuration instance
   * @example
   * const config = new Configuration(
   *   'config.yaml',           // filename
   *   ['./config', './'],      // search paths
   *   'schema.json',           // schema file
   *   { baseDir: __dirname },  // replacements
   *   () => console.log('Loaded'), // success callback
   *   (err) => console.error(err)  // error callback
   * );
   */
  constructor(filename, ...args) {
    let searchPaths = null,
      schemaFile = null,
      replacements = null,
      loadCallback = null,
      errorCallback = null;

    this.replacements = {};

    if (app) {
      this.replacements = { app: app.getAppPath() };
    } else {
      this.replacements = { app: process.cwd() };
    }

    // Sort remaining arguments by type
    for (const arg of args) {
      if (Array.isArray(arg)) {
        searchPaths = arg;
      } else if (typeof arg === 'string') {
        schemaFile = arg;
      } else if (typeof arg === 'object' && arg !== null) {
        replacements = arg;
      } else if (typeof arg === 'function') {
        if (loadCallback === null) {
          loadCallback = arg;
        } else {
          errorCallback = arg;
        }
      }
    }

    const resolvedPath = this.#resolve(filename, searchPaths);

    // Get existing instance or create new one
    let instance = Configuration.#instances.get(resolvedPath);
    let target = instance || this;

    target.configFile = resolvedPath;

    if (schemaFile && args.length > 0) {
      target.schemaFile = this.#resolve(schemaFile, searchPaths);
      let contents = fs.readFileSync(target.schemaFile, 'utf8');
      target.schema = yaml.parse(contents);
    }

    // override replacements, loadCallback, and errorCallback if provided
    if (args.length > 0) {
      target.replacements = { ...target.replacements, ...replacements };
      target.loadCallback = loadCallback;
      target.errorCallback = errorCallback;
    }

    if (instance) {
      return instance;
    }

    const proxiedInstance = new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          if (typeof target[prop] === 'function') {
            return target[prop].bind(target);
          }
          return target[prop];
        } else {
          if (target.#options && prop in target.#options) {
            return target.#options[prop];
          }
          return null;
        }
      },
      set: (target, prop, value) => {
        if (prop in target) {
          target[prop] = value;
        } else {
          target.#options[prop] = value;
        }
        return true;
      },
    });

    // Store instance for this resolved path
    Configuration.#instances.set(resolvedPath, proxiedInstance);
    this.#watch(this.configFile);

    return proxiedInstance;
  }

  /**
   * Save the current configuration back to the original YAML file
   * @returns {void}
   * @throws {Error} If unable to write to file
   */
  save() {
    if (!this.configFile) {
      throw new Error('No config file specified');
    }

    try {
      const yamlStr = yaml.stringify(this.#options);
      fs.writeFileSync(this.configFile, yamlStr, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Close and cleanup resources by stopping the file watcher
   * @returns {void}
   */
  close() {
    if (this.#watcher) {
      this.#watcher.unref();
      this.#watcher = null;
    }
  }

  #resolve(configFile, searchPaths = null) {
    const paths = (searchPaths || Configuration.#defaultPaths)
      .filter((path) => path)
      .map((basePath) => join(basePath, configFile));

    for (const path of paths) {
      if (fs.existsSync(path)) {
        return path; // return the first found file
      }
    }

    throw new Error(`${configFile} not found in any directory.`);
  }

  #loadYaml(file) {
    try {
      let yamlContent = fs.readFileSync(file, 'utf8');

      // Handle variable replacements like {VAR} if replacements provided
      if (this.replacements) {
        yamlContent = yamlContent.replace(/\{(\w+)\}/g, (match, key) => {
          if (Object.prototype.hasOwnProperty.call(this.replacements, key)) {
            return this.replacements[key];
          }

          return match;
        });
      }

      const data = yaml.parse(yamlContent);

      // validate the YAML file against a schema if provided
      if (this.schema) {
        const ajv = new Ajv({ strictSchema: false });
        const validate = ajv.compile(this.schema);
        validate(data);

        if (validate.errors) {
          return validate.errors;
        }
      }

      this.#options = data;
    } catch (error) {
      return error;
    }

    return null;
  }

  #watch(file) {
    const errors = this.#loadYaml(file);

    if (errors && this.errorCallback) {
      this.errorCallback(errors);
    } else if (!errors && this.loadCallback) {
      this.loadCallback();
    }

    this.#watcher = fs.watchFile(file, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('Reloading config file...');
        const errors = this.#loadYaml(file);

        if (errors && this.errorCallback) {
          this.errorCallback(errors);
        }

        if (!errors && this.loadCallback) {
          this.loadCallback();
        }
      }
    });
  }
}

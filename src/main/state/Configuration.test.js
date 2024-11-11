import { describe, it, expect } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import yaml from 'yaml';
import Configuration from './Configuration.js';

describe('Configuration', () => {
  const testConfig = {
    server: {
      port: 3000,
      host: 'example.com',
    },
    database: {
      url: 'mongodb://localhost:27017',
      name: 'testdb',
    },
    logging: {
      level: 'info',
      file: '/var/log/app.log',
    },
  };

  const testSchema = {
    type: 'object',
    properties: {
      server: {
        type: 'object',
        required: ['port', 'host'],
        properties: {
          port: { type: 'number' },
          host: { type: 'string' },
        },
      },
      database: {
        type: 'object',
        required: ['url', 'name'],
        properties: {
          url: { type: 'string' },
          name: { type: 'string' },
        },
      },
      logging: {
        type: 'object',
        required: ['level'],
        properties: {
          level: {
            type: 'string',
            enum: ['debug', 'info', 'warn', 'error'],
          },
          file: { type: 'string' },
        },
      },
    },
  };

  let loadCallback = () => {};
  let errorCallback = (errors) => {
    expect(errors).toBeTruthy();
  };

  let useFile = (filename) => {
    const schemaFile = filename.replace(/(\.[^.]+)$/, '.schema$1');
    return [filename, schemaFile];
  };

  it('should load valid configuration', () => {
    const [configPath, schemaPath] = useFile('valid-config.yaml');

    writeFileSync(configPath, yaml.stringify(testConfig));
    writeFileSync(schemaPath, yaml.stringify(testSchema));

    const config = new Configuration(configPath, schemaPath, loadCallback, errorCallback);
    expect(config.options).toEqual(testConfig);

    unlinkSync(configPath);
    unlinkSync(schemaPath);
  });

  it('should detect schema violations', () => {
    const [configPath, schemaPath] = useFile('invalid-schema.yaml');

    const invalidConfig = {
      server: {
        port: '3000', // Should be number, not string
        host: 'localhost',
      },
      database: {
        url: 'mongodb://localhost:27017',
        name: 'testdb',
      },
    };

    writeFileSync(configPath, yaml.stringify(invalidConfig));
    writeFileSync(schemaPath, yaml.stringify(testSchema));

    const config = new Configuration(configPath, schemaPath, loadCallback, errorCallback);
    expect(config.options).toEqual(invalidConfig);

    unlinkSync(configPath);
    unlinkSync(schemaPath);
  });

  it('should handle variable replacements', () => {
    const configWithVars = {
      server: {
        port: 3000,
        host: '{HOST}',
      },
      database: {
        url: '{DB_URL}',
        name: '{DB_NAME}',
      },
    };

    const [configPath, schemaPath] = useFile('config-with-vars.yaml');
    writeFileSync(configPath, yaml.stringify(configWithVars));
    writeFileSync(schemaPath, yaml.stringify(testSchema));

    const replacements = {
      HOST: 'example.com',
      DB_URL: 'mongodb://example.com:27017',
      DB_NAME: 'proddb',
    };

    const config = new Configuration(configPath, schemaPath, replacements, loadCallback, errorCallback);

    expect(config.options.server.host).toBe('example.com');
    expect(config.options.database.url).toBe('mongodb://example.com:27017');
    expect(config.options.database.name).toBe('proddb');

    unlinkSync(configPath);
    unlinkSync(schemaPath);
  });

  it('should watch for file changes', async () => {
    const [configPath, schemaPath] = useFile('watch-config.yaml');
    writeFileSync(configPath, yaml.stringify(testConfig));
    writeFileSync(schemaPath, yaml.stringify(testSchema));

    let first = true;

    await new Promise((resolve) => {
      new Configuration(configPath, schemaPath, (options) => {
        if (first) {
          expect(options.server.port).toBe(3000);
          first = false;
        } else {
          expect(options.server.port).toBe(4000);
          unlinkSync(configPath);
          unlinkSync(schemaPath);
          resolve(); // End the test
        }
      });

      const updatedConfig = { ...testConfig };
      updatedConfig.server.port = 4000;

      writeFileSync(configPath, yaml.stringify(updatedConfig));
    });
  });
});

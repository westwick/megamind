import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import yaml from 'yaml';
import Configuration from './newConfig';

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

  const configPath = 'test-config.yaml';
  const configPath2 = 'test-config2.yaml';
  const schemaPath = 'test-schema.yaml';

  let loadCallback = () => {};
  let errorCallback = (errors) => {
    expect(errors).toBeTruthy();
  };

  beforeEach(() => {
    // Write test files
    writeFileSync(configPath, yaml.stringify(testConfig));
    writeFileSync(configPath2, yaml.stringify(testConfig));
    writeFileSync(schemaPath, yaml.stringify(testSchema));
  });

  afterEach(() => {
    // Cleanup test files
    try {
      unlinkSync(configPath);
      unlinkSync(configPath2);
      unlinkSync(schemaPath);
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should load valid configuration', () => {
    const config = new Configuration(
      configPath,
      schemaPath,
      loadCallback,
      errorCallback
    );
    expect(config.options).toEqual(testConfig);
  });

  it('should detect schema violations', () => {
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

    writeFileSync(configPath2, yaml.stringify(configWithVars));

    const replacements = {
      HOST: 'example.com',
      DB_URL: 'mongodb://example.com:27017',
      DB_NAME: 'proddb',
    };

    const config = new Configuration(
      configPath2,
      schemaPath,
      replacements,
      loadCallback,
      errorCallback
    );

    expect(config.options.server.host).toBe('example.com');
    expect(config.options.database.url).toBe('mongodb://example.com:27017');
    expect(config.options.database.name).toBe('proddb');
  });

  it('should watch for file changes', (done) => {
    const config = new Configuration(
      configPath,
      schemaPath,
      null,
      () => {
        // Config loaded callback
        const updatedConfig = { ...testConfig };
        updatedConfig.server.port = 4000;

        writeFileSync(configPath, yaml.stringify(updatedConfig));
      },
      (err) => {
        // Error callback
        expect(err).toBeFalsy();
      }
    );

    // Wait for file watch to detect change
    setTimeout(() => {
      expect(config.options.server.port).toBe(4000);
      done();
    }, 100);
  });
});

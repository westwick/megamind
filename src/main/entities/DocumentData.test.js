import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import DocumentData from './DocumentData.js';
import fs from 'fs/promises';

describe('DocumentData', () => {
  let documentData;

  beforeAll(async () => {
    try {
      await fs.unlink('test.json');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  });

  beforeEach(async () => {
    documentData = new DocumentData('test.json');
    await documentData.load();
  });

  it('should set and get data correctly', async () => {
    await documentData.set('set-get', { name: 'Test Name', foo: 'bar' });
    await documentData.save();
    const result = await documentData.get('set-get');
    expect(result.name).toBe('Test Name');
    expect(result.foo).toBe('bar');
  });

  it('should increase the version correctly', async () => {
    await documentData.set('version', { name: 'Test Name', foo: 'bar' });
    await documentData.save();
    const result = await documentData.get('version');
    expect(result.$$meta.version).toBe(1);

    await documentData.set('version', { name: 'New Test Name', foo: 'baz' });
    await documentData.save();
    const version = await documentData.get('version');
    expect(version.$$meta.version).toBe(2);
  });

  it('should remove old versions after load', async () => {
    const result = await documentData.get('version');
    expect(result.name).toBe('New Test Name');
    expect(result.foo).toBe('baz');
    expect(result.$$meta.version).toBe(2);
  });

  it('should delete data correctly', async () => {
    await documentData.set('delete-test', { name: 'Delete Name', foo: 'cow' });
    await documentData.save();
    await documentData.delete('delete-test');
    await documentData.save();
    const result = await documentData.get('delete-test');
    expect(result).toBeUndefined();

    const result2 = await documentData.load();
    expect(result2.get('delete-test')).toBeUndefined();
  });

  it('should save changes to the file', async () => {
    await documentData.set('test-id', { name: 'UniqueTestName', foo: 'bar' });
    await documentData.save();
    const content = await fs.readFile('test.json', 'utf8');
    expect(content).toContain('"name":"UniqueTestName"');
  });

  afterAll(async () => {
    await documentData.deleteDatabase();
  });
});

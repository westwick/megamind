import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import readline from 'readline';
import { Readable } from 'stream';
import lockfile from 'proper-lockfile';

export default class DocumentData {
  _changes = new Map();
  _data = new Map();

  constructor(filename) {
    this.filename = filename;
    this.directory = path.dirname(filename);
  }

  async load(lock = true) {
    await this.constructor._ensureDirExists(this.directory);

    let release;

    if (lock) {
      release = await lockfile.lock(this.directory, {
        retries: 10,
        lockfilePath: path.join(this.directory, 'dir.lock'),
      });
    }

    await this.constructor._ensureFileExists(this.filename);

    if (release) {
      await release();
    }

    if (lock) {
      release = await lockfile.lock(this.filename, { retries: 10 });
    }

    const stat = await fs.stat(this.filename);
    const useFileStream = stat.size > 1024 * 1024 * 100; // 100MB
    const stream = useFileStream
      ? this._createFileStream(this.filename)
      : await this._createMemoryStream(this.filename);

    for await (const line of this._readLines(stream)) {
      if (line && line.length > 0) {
        this._apply(line.trim());
      }
    }

    if (release) {
      await release();
    }

    await this._serializeToFile(lock); // write compacted changes

    return this;
  }

  async _serializeToFile(lock = true) {
    let release;

    if (lock) {
      release = await lockfile.lock(this.filename, { retries: 10 });
    }

    await fs.writeFile(this.filename, this._serialize());

    if (release) {
      await release();
    }
  }

  _serialize() {
    let output = '';
    for (const [, value] of this._data) {
      output += JSON.stringify(value) + '\n';
    }
    return output;
  }

  async *_readLines(stream) {
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      yield line;
    }
  }

  async _createMemoryStream(filename) {
    const content = await fs.readFile(filename, 'utf8');
    const memoryStream = new Readable();
    memoryStream.push(content);
    memoryStream.push(null); // Signal end of stream
    return memoryStream;
  }

  _createFileStream(filePath) {
    return createReadStream(filePath);
  }

  static async _ensureDirExists(dir) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  static async _ensureFileExists(filename) {
    try {
      await fs.access(filename);
    } catch {
      await fs.writeFile(filename, '');
    }
  }

  async deleteDatabase() {
    return await fs.unlink(this.filename);
  }

  _apply(line) {
    const data = JSON.parse(line);

    if (data.$$action === 'delete') {
      this._data.delete(data._id);
    } else if (data._id) {
      this._data.set(data._id, data);
    }
  }

  get(id) {
    return this._data.get(id);
  }

  set(id, data) {
    const existing = this._data.get(id);
    const meta = this._updateMeta(existing || data);

    if (!id) {
      id = crypto.randomUUID();
    }

    this._changes.set(id, { _id: id, ...data, $$meta: meta });
    this._data.set(id, { _id: id, ...data, $$meta: meta });

    return this._data.get(id);
  }

  changed(id) {
    this._changes.set(id, this._data.get(id));
  }

  has(id) {
    return this._data.has(id);
  }

  all() {
    return Array.from(this._data.values());
  }

  delete(id) {
    if (this._data.delete(id)) {
      this._changes.set(id, { _id: id, $$action: 'delete' });
    }
  }

  clear() {
    Array.from(this._data.keys()).forEach((id) => this.delete(id));
  }

  clearChange(id) {
    this._changes.delete(id);
  }

  _updateMeta(record) {
    return {
      version: record.$$meta?.version + 1 || 1,
      created: record.$$meta?.created || new Date().toISOString(),
      modified: new Date().toISOString(),
    };
  }

  // this will write the changes line by line to the file, there can now be duplicates in there but they will get
  // resolved on load
  async save() {
    let release;
    let lockOptions = { retries: 10 };
    let queue = [];

    for (const [key, change] of this._changes) {
      queue.push(change);
      this._changes.delete(key);

      if (queue.length > 1000 || this._changes.size === 0) {
        const content = queue.map(JSON.stringify).join('\n');

        // https://www.notthewizard.com/2014/06/17/are-files-appends-really-atomic/
        if (content.length >= 1024 && !release) {
          release = await lockfile.lock(this.filename, lockOptions);
        }

        await fs.appendFile(this.filename, content + '\n');
        queue = [];
      }
    }

    if (release) {
      await release();
    }
  }
}

/*
async function benchmark() {
  const data = new DocumentData('bench.json');
  await data.load();

  console.log('Test starting....');
  const start = performance.now();
  let operations = 0;
  while (performance.now() - start < 10000) {
    const op = Math.floor(Math.random() * 3);
    switch (op) {
      case 0:
        data.set(`bench-${operations}`, { foo: Math.random() });
        break;
      case 1:
        data.get(`bench-${operations}`);
        break;
      case 2:
        data.delete(`bench-${operations}`);
        break;
    }

    if (operations % 10 === 0) {
      await data.save();
    }
    operations++;
  }
  console.log('Test complete, saving....');

  const startSave = performance.now();
  await data.save();
  console.log(`Saving took ${performance.now() - startSave}ms`);

  console.log(`Operations per second: ${(operations / (performance.now() - start)) * 1000}`);
}

benchmark().catch((err) => console.error(err));
*/

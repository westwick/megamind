import fs from "fs";
import zlib from "zlib";
import readline from "readline";
import path from "path";

async function detectEncoding(stream) {
  return new Promise((resolve) => {
    const chunk = Buffer.alloc(2);
    stream.once("readable", () => {
      stream.read(2).copy(chunk);
      // Check for UTF-16LE BOM (0xFF 0xFE)
      resolve(chunk[0] === 0xff && chunk[1] === 0xfe ? "utf16le" : "utf8");
      stream.unshift(chunk);
    });
  });
}

async function createReadStream(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const isGzipped = path.extname(filePath).toLowerCase() === ".gz";

  if (isGzipped) {
    return fileStream.pipe(zlib.createGunzip());
  }

  return fileStream;
}

export async function readJsonLinesFile(filePath) {
  const stream = await createReadStream(filePath);
  const encoding = await detectEncoding(stream);

  const rl = readline.createInterface({
    input: stream.setEncoding(encoding),
    crlfDelay: Infinity,
  });

  const jsonLines = [];

  for await (let line of rl) {
    try {
      // Remove BOM if present
      if (encoding === "utf16le" && line.charCodeAt(0) === 0xfeff) {
        line = line.slice(1);
      }
      const jsonObject = JSON.parse(line);
      jsonLines.push(jsonObject);
    } catch (error) {
      console.error(`Error parsing JSON on line: ${line}`);
      console.error(error);
    }
  }

  return jsonLines;
}

export default readJsonLinesFile;

/* eslint-disable no-control-regex */
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/** @returns {String} The pluralized form of a word. */
String.prototype.pluralize = function () {
  const word = this.toString(); // Convert to string
  const lastLetter = word.slice(-1);
  const lastTwoLetters = word.slice(-2);

  if (
    lastTwoLetters === 'ch' ||
    lastTwoLetters === 'sh' ||
    lastLetter === 's' ||
    lastLetter === 'x' ||
    lastLetter === 'z'
  ) {
    return word + 'es';
  } else if (lastLetter === 'y' && !/[aeiou]/.test(word[word.length - 2])) {
    return word.slice(0, -1) + 'ies';
  } else if (lastLetter === 'o') {
    if (/[aeiou]/.test(word[word.length - 2])) {
      return word + 's'; // Vowel + o
    } else {
      return word + 'es'; // Consonant + o
    }
  } else if (word.toLowerCase().endsWith('data')) {
    return word;
  } else {
    return word + 's';
  }
};

/** @returns {String} Cleans up and formats a stack trace in columns. */
String.prototype.cleanStackTrace = function () {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const basePath =
    'file://' + path.resolve(__dirname, '..').replace(/\\/g, '/');

  return this.split('\n')
    .filter((line) => line.includes(basePath))
    .map((line) => {
      // Match file path and line number first
      const fileMatch =
        line.trim().match(/\((.*?):(\d+):\d+\)/) ||
        line.trim().match(/(file:\/\/.*?):(\d+):\d+/);
      if (!fileMatch) return line;

      const [fullMatch, file, lineNum] = fileMatch;
      const cleanFile = file.replace(basePath, '');

      // Remove the file part from the line to check for the method
      const methodMatch = line
        .replace(fullMatch, '')
        .trim()
        .match(/at (.*)/);
      const method = methodMatch ? methodMatch[1] : '';

      return `  ${lineNum.trim().padEnd(5)} ${(method || '').padEnd(30)} ${cleanFile}`;
    })
    .join('\n');
};

String.prototype.substitute = function (obj) {
  return this.replace(/{([\w.]+)}/g, (match, p1) => {
    return p1.split('.').reduce((obj, key) => obj?.[key], obj) ?? match;
  });
};

String.prototype.stripAnsi = function () {
  return this.toString().replaceAll(/\u001B\[[0-9]*(?:;[0-9]+)*[a-zA-Z]{1}/g, '');
};

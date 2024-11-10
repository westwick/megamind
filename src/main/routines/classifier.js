/* eslint-disable prettier/prettier */
/* eslint-disable max-len */
/* eslint-disable no-control-regex */
const linePatterns = {
  stealth: {
    'user-sneaking': /^Sneaking.../,
    'user-not-sneaking': /^You make a sound as you enter the room!/,
    'user-sneak-failed': /^Attempting to sneak\.\.\.You don't think you're sneaking\./,
    'user-sneak-initiate': /^Attempting to sneak\.\.\.$/,
    'user-cant-sneak': /^You may not sneak right now!/,
  },
  movement: {
    'direction-failed': [
      /^There is no exit in that direction!$/,
      /^The (?:door|gate) is closed(?: in that direction)?!/,
    ],
    'bash-failed': /^Your attempts to bash through fail!$/,
    'heard-movement': /^You hear movement to the \w+\./,
  },
  failures: {
    'command-no-effect': /^Your command had no effect.$/,
    'command-ignored': /^You are typing too quickly - command ignored/,
    'slow-down': /^Why don't you slow down for a few seconds\?/,
  },
  searching: {
    'user-search-failed': /^You notice nothing different to the \w+/,
    'user-search-succeeded': /^You found an exit to the (?<direction>\w+)!/,
  },
  combat: {
    'combat-status': /^\*Combat (?<status>Engaged|Off)\*/,
    'user-hits': /^(?<source>[\w]+) (?:critically )?(?:\w+) (?<target>[\w- ]+) for (?<damage>\d+) damage!/,
    'mob-misses': /^The (?<target>[\w -]+) \w+ at you\./,
    'mob-hits': /^The (?<target>[\w -]+) \w+ you for (?<damage>\d+) damage!/,
    'user-gain-experience': /^You gain (?<exp>\d+) experience./,
  },
  conversation: {
    'conversation-gossip': /^(?<player>\w+) gossips: (?<message>.+)/,
    'conversation-broadcast': /^Broadcast from (?<player>\w+) "(?<message>.+)"/,
    'conversation-gangpath': /^(?<player>\w+) gangpaths: (?<message>.+)/,
    'conversation-telepath': [/^(?<player>\w+) telepaths: (?<message>.+)/, /^--- Telepath sent to (?<player>\w+) ---$/],
    'conversation-yell': [/^(?<player>\w+) yells "(?<message>.+)"/, /^You yell "(?<message>.+)"/],
    'conversation-local': /^(?<player>\w+) says? "(?<message>.+)"/,
    'user-emote': /^\u001B\[K\u001B\[0;32m(?<player>You|[\w]+) (?<action>.*)(?:\.|!|\*)$/,
  },
  'action-items': {
    'user-hides': /^You hid (?<item>.*)\./,
    'player-gets': [/^(?<player>[\w]+) picks up (?<item>.*)\./, /^You took (?<item>.*)\./],
    'player-drops': [/^(?<player>[\w]+) drops (?<item>.*)\./, /^You dropped (?<item>.*)\./],
    'user-equipped-failed': /^You may not wear that item!$/,
    'user-removed': /^You have removed (?<item>[\w ]+?)(?: and extinguished it)?\.$/,
    'user-equipped': [/^You are now wearing (?<item>[\w ]+)\.$/, /^You lit the (?<item>[\w ]+)\.$/],
    'hidden-items': /^You notice (?<items>.*)(?:\r\n| )/,
    'user-list': /^The following items are for sale here:$/,
    'user-buys': /^You just bought (?:(?<qty>\d+) )?(?<item>[\w ]+) for (?<price>\d+) copper farthings\.$/,
  },
  room: {
    'room-exits': /^Obvious exits: [\w, ]+/ms,
  },
  status: {
    'status-line': /^\[HP=(?<hp>\d{1,4})(?:\/(?<type>MA|KAI)=(?<mana>\d{1,3}))?(?:\s\((?<statea>Resting|Meditating)\)\s)?\]:(?:\s\((?<stateb>Resting|Meditating)\))?/,
    'user-experience': /^Exp: (?<exp>\d+) Level: (?<level>\d+) Exp needed for next level: (?<need>\d+) \((?<req>\d+)\) \[(?<per>\d+)%\]/,
    'user-profile': /^(Recent Deaths:|Location:)/,
    'user-encumbrance': /^Encumbrance:\s+\d+/,
    'user-status': /Willpower:\s+\d{2,3}/,
  },
  module: {
    'player-disconnects': /^(?<player>\w+) just disconnected!!!./,
    'player-exits': /^(?<player>\w+) just left the Realm./,
    'player-enters': /^(?<player>\w+) just entered the Realm./,
  },
};

const batchPatterns = {
  who: {
    'who-list': [/^\s+Current Adventurers/m, /^\s+Title\s+Name\s+Reputation\s+Gang\/Guild\s*$/m],
  },
};

function classify(message, patterns = linePatterns) {
  for (const [parentEvent, value] of Object.entries(patterns)) {
    for (const [event, pattern] of Object.entries(value)) {
      if (Array.isArray(pattern)) {
        const match = pattern.find((p) => message.match(p));

        if (match) {
          return { parentEvent, event, matches: match.groups };
        }
      } else if (pattern instanceof RegExp) {
        const match = message.match(pattern);

        if (match) {
          return { parentEvent, event, matches: match.groups };
        }
      }
    }
  }
}

function classifyLine(line) {
  return classify(line);
}

function classifyBatch(lines) {
  for (const line of lines) {
    const match = classify(line, batchPatterns);

    if (match) {
      return match;
    }
  }
}

export { classifyLine, classifyBatch };

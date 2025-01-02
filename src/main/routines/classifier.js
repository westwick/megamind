/* eslint-disable prettier/prettier */
/* eslint-disable max-len */
/* eslint-disable no-control-regex */

import RealmData from '../entities/RealmData.js';

const realmData = await RealmData.create('default');

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
    // TODO: duplicate matching name
    // 'conversation-telepath': [/^(?<player>\w+) telepaths: (?<message>.+)/, /^--- Telepath sent to (?<player>\w+) ---$/],
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
    // TODO: hidden-items isn't just hidden items.. not sure how we will categorise
    //'hidden-items': /^You notice (?<items>.*)(?: here.)/,
    'user-list': /^The following items are for sale here:$/,
    'user-buys': /^You just bought (?:(?<qty>\d+) )?(?<item>[\w ]+) for (?<price>\d+) copper farthings\.$/,
  },
  room: {
    'obvious-exits': /^Obvious exits: (?<items>[\w, ]+)/,
    'also-here' : /^Also here: (?<items>.*)(?:\r\n|.)/,
    'you-notice': /^You notice (?<items>.*)(?: here.)/,
  },
  statusLine: {
    'status-line': /^\[HP=(?<hp>\d{1,4})(?:\/(?<type>MA|KAI)=(?<mana>\d{1,3}))?(?:\s\((?<statea>Resting|Meditating)\)\s)?\]:(?:\s\((?<stateb>Resting|Meditating)\))?/
  },
  userStatus : {
    'user-experience': /^Exp: (?<exp>\d+) Level: (?<level>\d+) Exp needed for next level: (?<need>\d+) \((?<req>\d+)\) \[(?<percent>\d+)%\]/,
    'user-profile': /^(Recent Deaths:|Location:)/,
    'user-encumbrance': /^Encumbrance:\s+\d+/,
  },
  module: {
    'player-disconnects': /^(?<player>\w+) just disconnected!!!./,
    'player-exits': /^(?<player>\w+) just left the Realm./,
    'player-enters': /^(?<player>\w+) just entered the Realm./,
  },
};

const batchPatterns = {
  'who-fantasy': {
    match: /^\s+Current Adventurers\s*$/m,
    type: 'array',
    qualifiers: [
      // eslint-disable-next-line no-regex-spaces
      new RegExp(
        `^\\s*( {8}|${realmData.alignments.join('|')}) (\\w+) (\\w+)? *([-x])  (${realmData.getAllTitles().join('|')}) *(?: of ([\\w ]+?)(?=(?: (?:M|S|V))? *$))?(?: (M|S|V))?$`,
      ),
    ],
  },
  'who-technical': {
    match: /^\s+Title\s+Name\s+Reputation\s+Gang\/Guild\s*$/m,
    type: 'array',
    qualifiers: [
      /^(.{1,15})\s+(\S+)\s*(\S*)\s*([ga]*)\s*(Good|Neutral|Seedy|Criminal|Lawful|Villain|Saint|Outlaw)\s+(.*)$/,
    ],
  },
  'player-status': {
    match: /^Name:\s+[\w\s]+\s+Lives\/CP:\s+\d+\/\d+/,
    type: 'object',
    qualifiers: [
      /^Name:\s+(?<first>\w+) (?<last>\w*)\s+Lives\/CP:\s+(?<lives>\d+)\/(?<cp>\d+)/m,
      /^Race:\s+(?<race>[\w-]+)\s+Exp:\s+(?<exp>\d+)\s+Perception:\s+(?<perception>\d+)/m,
      /^Class:\s+(?<class>\w+)\s+Level: (?<level>\d+)\s+Stealth:\s+(?<stealth>\d+)/m,
      /^Hits:\s+(?<hp>\d+)\/(?<hpmax>\d+)\s+Armour Class:\s+(?<ac>\d+)\/(?<dr>\d+)\s+Thievery:\s+(?<thievery>\d+)/m,
      /^(?:(?:Mana|Kai):\s+(?<ma>\d+)\/(?<mamax>\d+))?\s+(?:Spellcasting:\s+(?<sc>\d+)\s+)?Traps:\s+(?<traps>\d+)/m,
      /^\s+Picklocks:\s+(?<picks>\d+)/m,
      /^Strength:\s+(?<strength>\d+)\s+Agility:\s+(?<agility>\d+)\s+Tracking:\s+(?<tracking>\d+)/m,
      /^Willpower:\s+(?<willpower>\d+)\s+Charm:\s+(?<charm>\d+)\s+MagicRes:\s+(?<mres>\d+)/m,
    ],
  },
};

const patterns = {
  ...Object.entries(linePatterns).reduce((acc, [, subPatterns]) => {
    Object.entries(subPatterns).forEach(([key, pattern]) => {
      acc[key] = pattern;
    });
    return acc;
  }, {}),
  ...Object.entries(batchPatterns).reduce((acc, [key, pattern]) => {
    acc[key] = pattern.match;
    return acc;
  }, {})
};

 function formatLine(message, targetEvent, patterns = linePatterns ) {
  for (const [parentEvent, value] of Object.entries(patterns)) {
    for (const [event, pattern] of Object.entries(value)) {
      if (event == targetEvent) {
        const match = message.match(pattern);
        if (match){
          if (match.groups){
            return { parentEvent, event, matches: match.groups };
          } else {
            return { parentEvent, event, matches: match[1] }; // no idea why rooms won't match on a group.. 
          }
        }
      }
    }
  }
}

function classifyLine(message, patterns = linePatterns) {
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
          if (match.groups){
            return { parentEvent, event, matches: match.groups };
          }
        }
      }
    }
  }
}

function removeBackspaces(str) {
  let result = []; 
   
  for (let i = 0; i < str.length; i++) {
      if (str[i] === '\b') {
          result.pop();
      } else {
          result.push(str[i]);
      }
  }
  
  return result.join('');
}

function classifyBatch(lines) {
  let match;

  for (const line of lines) {
    for (const [key, pattern] of Object.entries(batchPatterns)) {
      if (line.match(pattern.match)) {
        match = { key, ...pattern };
        break;
      }
    }

    if (match) {
      break;
    }
  }

  if (match) {
    let matches;

    for (const line of lines) {
      if (match.type === 'array') {
        for (const qualifier of match.qualifiers) {
          const result = line.match(qualifier);

          if (result) {
            if (!matches) {
              matches = [];
            }

            if (result.groups) {
              matches.push(result.groups);
            } else {
              matches.push(result);
            }
          }
        }
      } else if (match.type === 'object') {
        const result = match.qualifiers.map((q) => line.match(q)).find(Boolean);

        if (result && result.groups) {
          if (!matches) {
            matches = {};
          }

          Object.assign(matches, result.groups);
        }
      }
    }

    return { event: match.key, matches };
  }
}

export { classifyLine, classifyBatch, removeBackspaces, formatLine,  patterns };

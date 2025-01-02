/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
import PersistableEntity from "./PersistableEntity.js";
import PersistableProperty from "./PersistableProperty.js";

export default class RealmData extends PersistableEntity {
    alignments = new PersistableProperty();
    classes = new PersistableProperty();
    races = new PersistableProperty();

    findClassByTitle(title) {
        let foundClass = undefined;

        for (const [className, classData] of Object.entries(this.classes)) {
            for (const classTitle of classData.titles) {
                const [first, second] = classTitle.split("|");
                if ((first && first.startsWith(title)) || (second && second.startsWith(title))) {
                    return className; // Return first match
                }
            }
        }

        return foundClass;
    }

    findLevelRangeByTitle(title) {
        let minLevel = Infinity;
        let maxLevel = -1;

        for (const classData of Object.values(this.classes)) {
            for (let i = 0; i < classData.titles.length; i++) {
                const [first, second] = classData.titles[i].split("|");

                if ((first && first.startsWith(title)) || (second && second.startsWith(title))) {
                    minLevel = Math.min(minLevel, i + 1);
                    maxLevel = Math.max(maxLevel, i + 1);
                }
            }
        }

        if (minLevel === Infinity || maxLevel === -1) {
            return undefined;
        }

        return minLevel === maxLevel ? `${minLevel}` : `${minLevel}-${maxLevel}`;
    }

    getAllTitles() {
        const uniqueTitles = new Set();

        for (const classData of Object.values(this.classes)) {
            classData.titles.forEach(title => {
                // Handle titles with gender variations (e.g. "Lord|Lady")
                if (title.includes("|")) {
                    const [male, female] = title.split("|");
                    uniqueTitles.add(male);
                    uniqueTitles.add(female);
                } else {
                    uniqueTitles.add(title);
                }
            });
        }

        return Array.from(uniqueTitles).sort((a, b) => b.length - a.length);
    }
}

const defaultData = {
    alignments: [
        'Saint',
        'Good',
        'Neutral',
        'Seedy',
        'Outlaw',
        'Criminal',
        'Villain',
        'FIEND',
    ],
    classes: {
        Warrior: {
            titles: ["Apprentice", "Warrior Novice", "Warrior Novice", "Warrior Novice", "Grunt", "Grunt", "Grunt", "Grunt", "Grunt", "Fighter", "Fighter", "Fighter", "Fighter", "Fighter", "Veteran", "Veteran", "Veteran", "Veteran", "Veteran", "Mercenary", "Mercenary", "Mercenary", "Mercenary", "Mercenary", "Duelist", "Duelist", "Duelist", "Duelist", "Duelist", "Dragoon", "Dragoon", "Dragoon", "Dragoon", "Dragoon", "Gladiator", "Gladiator", "Gladiator", "Gladiator", "Gladiator", "Myrmidon", "Myrmidon", "Myrmidon", "Myrmidon", "Myrmidon", "Lord|Lady", "Lord|Lady", "Lord|Lady", "Lord|Lady", "Lord|Lady", "Hero|Heroine", "Hero|Heroine", "Hero|Heroine", "Hero|Heroine", "Hero|Heroine", "Weaponmaster|Weaponmistress", "Weaponmaster|Weaponmistress", "Weaponmaster|Weaponmistress", "Weaponmaster|Weaponmistress", "Weaponmaster|Weaponmistress", "Warmonger", "Warmonger", "Warmonger", "Warmonger", "Warmonger", "Warlord|Warlady", "Warlord|Warlady", "Warlord|Warlady", "Warlord|Warlady", "Warlord|Warlady", "Dragonslayer", "Dragonslayer", "Dragonslayer", "Dragonslayer", "Dragonslayer", "High Warlord", "High Warlord", "High Warlord", "High Warlord", "High Warlord", "Juggernaut", "Juggernaut", "Juggernaut", "Juggernaut", "Juggernaut", "Conqueror", "Conqueror", "Conqueror", "Conqueror", "Conqueror", "Dread Juggernaut", "Dread Juggernaut", "Dread Juggernaut", "Dread Juggernaut", "Dread Juggernaut", "Unstoppable Force", "Unstoppable Force", "Unstoppable Force", "Unstoppable Force", "Unstoppable Force", "Overlord", "Overlord", "Overlord", "Overlord", "Overlord", "Overlord", "Overlord", "Overlord", "Overlord", "Overlord" ]
        },
        Witchunter: {
            titles: ["Apprentice", "Witchunter Novice", "Witchunter Novice", "Witchunter Novice", "Persecutor", "Persecutor", "Persecutor", "Persecutor", "Persecutor", "Magehunter", "Magehunter", "Magehunter", "Magehunter", "Magehunter", "Magebane", "Magebane", "Magebane", "Magebane", "Magebane", "Spellbreaker", "Spellbreaker", "Spellbreaker", "Spellbreaker", "Spellbreaker", "Enforcer", "Enforcer", "Enforcer", "Enforcer", "Enforcer", "Disenchanter", "Disenchanter", "Disenchanter", "Disenchanter", "Disenchanter", "Eradicator", "Eradicator", "Eradicator", "Eradicator", "Eradicator", "Demonhunter", "Demonhunter", "Demonhunter", "Demonhunter", "Demonhunter", "Mageslayer", "Mageslayer", "Mageslayer", "Mageslayer", "Mageslayer", "Annihilator", "Annihilator", "Annihilator", "Annihilator", "Annihilator", "Inquisitor", "Inquisitor", "Inquisitor", "Inquisitor", "Inquisitor", "High Inquisitor", "High Inquisitor", "High Inquisitor", "High Inquisitor", "High Inquisitor", "Master Confessor", "Master Confessor", "Master Confessor", "Master Confessor", "Master Confessor", "Demonbane", "Demonbane", "Demonbane", "Demonbane", "Demonbane", "Witchflayer", "Witchflayer", "Witchflayer", "Witchflayer", "Witchflayer", "Dread Confessor", "Dread Confessor", "Dread Confessor", "Dread Confessor", "Dread Confessor", "Iconoclast", "Iconoclast", "Iconoclast", "Iconoclast", "Iconoclast", "Vampire Hunter", "Vampire Hunter", "Vampire Hunter", "Vampire Hunter", "Vampire Hunter", "God Hunter", "God Hunter", "God Hunter", "God Hunter", "God Hunter", "Deicide", "Deicide", "Deicide", "Deicide", "Deicide", "Deicide" ]
        },
        Paladin: {
            titles: ["Apprentice", "Paladin Novice", "Paladin Novice", "Paladin Novice", "Knave", "Knave", "Knave", "Knave", "Knave", "Squire", "Squire", "Squire", "Squire", "Squire", "Gallant", "Gallant", "Gallant", "Gallant", "Gallant", "Defender", "Defender", "Defender", "Defender", "Defender", "Cavalier", "Cavalier", "Cavalier", "Cavalier", "Cavalier", "Avenger", "Avenger", "Avenger", "Avenger", "Avenger", "Knight", "Knight", "Knight", "Knight", "Knight", "Crusader", "Crusader", "Crusader", "Crusader", "Crusader", "Templar", "Templar", "Templar", "Templar", "Templar", "Champion", "Champion", "Champion", "Champion", "Champion", "First Knight", "First Knight", "First Knight", "First Knight", "First Knight", "Lord Justice|Lady Justice", "Lord Justice|Lady Justice", "Lord Justice|Lady Justice", "Lord Justice|Lady Justice", "Lord Justice|Lady Justice", "Supreme Justice", "Supreme Justice", "Supreme Justice", "Supreme Justice", "Supreme Justice", "Grand Exemplar", "Grand Exemplar", "Grand Exemplar", "Grand Exemplar", "Grand Exemplar", "Sword of Justice", "Sword of Justice", "Sword of Justice", "Sword of Justice", "Sword of Justice", "High Justicar", "High Justicar", "High Justicar", "High Justicar", "High Justicar", "Grand Crusader", "Grand Crusader", "Grand Crusader", "Grand Crusader", "Grand Crusader", "Divine Champion", "Divine Champion", "Divine Champion", "Divine Champion", "Divine Champion", "Praetor", "Praetor", "Praetor", "Praetor", "Praetor", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine", "Sword of the Divine" ]
        },
        Cleric: {
            titles: ["Apprentice", "Cleric Novice", "Cleric Novice", "Cleric Novice", "Auxiliary", "Auxiliary", "Auxiliary", "Auxiliary", "Auxiliary", "Venerator", "Venerator", "Venerator", "Venerator", "Venerator", "Acolyte", "Acolyte", "Acolyte", "Acolyte", "Acolyte", "Fighter Priest|Fighter Priestess", "Fighter Priest|Fighter Priestess", "Fighter Priest|Fighter Priestess", "Fighter Priest|Fighter Priestess", "Fighter Priest|Fighter Priestess", "Canon", "Canon", "Canon", "Canon", "Canon", "Warrior Priest|Warrior Priestess", "Warrior Priest|Warrior Priestess", "Warrior Priest|Warrior Priestess", "Warrior Priest|Warrior Priestess", "Warrior Priest|Warrior Priestess", "Guardian", "Guardian", "Guardian", "Guardian", "Guardian", "Chaplain", "Chaplain", "Chaplain", "Chaplain", "Chaplain", "Vicar", "Vicar", "Vicar", "Vicar", "Vicar", "Chancellor", "Chancellor", "Chancellor", "Chancellor", "Chancellor", "Rector", "Rector", "Rector", "Rector", "Rector", "High Cleric", "High Cleric", "High Cleric", "High Cleric", "High Cleric", "Divine Protector", "Divine Protector", "Divine Protector", "Divine Protector", "Divine Protector", "Exalted Shield", "Exalted Shield", "Exalted Shield", "Exalted Shield", "Exalted Shield", "Bastion", "Bastion", "Bastion", "Bastion", "Bastion", "The Immovable", "The Immovable", "The Immovable", "The Immovable", "The Immovable", "Eternal Bulwark", "Eternal Bulwark", "Eternal Bulwark", "Eternal Bulwark", "Eternal Bulwark", "Divine Aegis", "Divine Aegis", "Divine Aegis", "Divine Aegis", "Divine Aegis", "Shield of the Faith", "Shield of the Faith", "Shield of the Faith", "Shield of the Faith", "Shield of the Faith", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine", "Will of the Divine" ]
        },
        Priest: {
            titles: ["Apprentice", "Priest Novice", "Priest Novice", "Priest Novice", "Clergyman|Clergywoman", "Clergyman|Clergywoman", "Clergyman|Clergywoman", "Clergyman|Clergywoman", "Clergyman|Clergywoman", "Curate", "Curate", "Curate", "Curate", "Curate", "Pastor", "Pastor", "Pastor", "Pastor", "Pastor", "Reverend", "Reverend", "Reverend", "Reverend", "Reverend", "Parson", "Parson", "Parson", "Parson", "Parson", "Minister", "Minister", "Minister", "Minister", "Minister", "Cardinal", "Cardinal", "Cardinal", "Cardinal", "Cardinal", "Pontiff", "Pontiff", "Pontiff", "Pontiff", "Pontiff", "Bishop", "Bishop", "Bishop", "Bishop", "Bishop", "High Priest|High Priestess", "High Priest|High Priestess", "High Priest|High Priestess", "High Priest|High Priestess", "High Priest|High Priestess", "Archbishop", "Archbishop", "Archbishop", "Archbishop", "Archbishop", "Chosen", "Chosen", "Chosen", "Chosen", "Chosen", "Prophet", "Prophet", "Prophet", "Prophet", "Prophet", "High Ecclesiast", "High Ecclesiast", "High Ecclesiast", "High Ecclesiast", "High Ecclesiast", "Presbyter", "Presbyter", "Presbyter", "Presbyter", "Presbyter", "High Pontiff", "High Pontiff", "High Pontiff", "High Pontiff", "High Pontiff", "Divine Prophet", "Divine Prophet", "Divine Prophet", "Divine Prophet", "Divine Prophet", "Voice of God", "Voice of God", "Voice of God", "Voice of God", "Voice of God", "Demigod", "Demigod", "Demigod", "Demigod", "Demigod", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity", "Archdeity" ]
        },
        Missionary: {
            titles: ["Apprentice", "Missionary Novice", "Missionary Novice", "Missionary Novice", "Initiate", "Initiate", "Initiate", "Initiate", "Initiate", "Witness", "Witness", "Witness", "Witness", "Witness", "Rogue Priest|Rogue Priestess", "Rogue Priest|Rogue Priestess", "Rogue Priest|Rogue Priestess", "Rogue Priest|Rogue Priestess", "Rogue Priest|Rogue Priestess", "Converter", "Converter", "Converter", "Converter", "Converter", "Infiltrator", "Infiltrator", "Infiltrator", "Infiltrator", "Infiltrator", "Oracle", "Oracle", "Oracle", "Oracle", "Oracle", "Evangelist", "Evangelist", "Evangelist", "Evangelist", "Evangelist", "Diviner", "Diviner", "Diviner", "Diviner", "Diviner", "Faithbringer", "Faithbringer", "Faithbringer", "Faithbringer", "Faithbringer", "Zealot", "Zealot", "Zealot", "Zealot", "Zealot", "Divine Messenger", "Divine Messenger", "Divine Messenger", "Divine Messenger", "Divine Messenger", "Apostle", "Apostle", "Apostle", "Apostle", "Apostle", "Revelator", "Revelator", "Revelator", "Revelator", "Revelator", "Divine Emissary", "Divine Emissary", "Divine Emissary", "Divine Emissary", "Divine Emissary", "The Glorified", "The Glorified", "The Glorified", "The Glorified", "The Glorified", "Righteous Messenger", "Righteous Messenger", "Righteous Messenger", "Righteous Messenger", "Righteous Messenger", "Envoy of the Master", "Envoy of the Master", "Envoy of the Master", "Envoy of the Master", "Envoy of the Master", "Hand of the Faith", "Hand of the Faith", "Hand of the Faith", "Hand of the Faith", "Hand of the Faith", "Archon", "Archon", "Archon", "Archon", "Archon", "Archangel", "Archangel", "Archangel", "Archangel", "Archangel", "Archangel", "Archangel", "Archangel" ]
        },
        Ninja: {
            titles: ["Apprentice", "Ninja Novice", "Ninja Novice", "Ninja Novice", "Menace", "Menace", "Menace", "Menace", "Menace", "Cutthroat", "Cutthroat", "Cutthroat", "Cutthroat", "Cutthroat", "Stalker", "Stalker", "Stalker", "Stalker", "Stalker", "Killer", "Killer", "Killer", "Killer", "Killer", "Nightstalker", "Nightstalker", "Nightstalker", "Nightstalker", "Nightstalker", "Murderer", "Murderer", "Murderer", "Murderer", "Murderer", "Manhunter", "Manhunter", "Manhunter", "Manhunter", "Manhunter", "Nightblade", "Nightblade", "Nightblade", "Nightblade", "Nightblade", "Assassin", "Assassin", "Assassin", "Assassin", "Assassin", "Executioner", "Executioner", "Executioner", "Executioner", "Executioner", "Revenant", "Revenant", "Revenant", "Revenant", "Revenant", "Master Assassin", "Master Assassin", "Master Assassin", "Master Assassin", "Master Assassin", "Shadow Master|Shadow Mistress", "Shadow Master|Shadow Mistress", "Shadow Master|Shadow Mistress", "Shadow Master|Shadow Mistress", "Shadow Master|Shadow Mistress", "Hand of the Unseen", "Hand of the Unseen", "Hand of the Unseen", "Hand of the Unseen", "Hand of the Unseen", "Shadow's Embrace", "Shadow's Embrace", "Shadow's Embrace", "Shadow's Embrace", "Shadow's Embrace", "Whisper of Death", "Whisper of Death", "Whisper of Death", "Whisper of Death", "Whisper of Death", "Death's Hand", "Death's Hand", "Death's Hand", "Death's Hand", "Death's Hand", "Death Incarnate", "Death Incarnate", "Death Incarnate", "Death Incarnate", "Death Incarnate", "Shadowlord", "Shadowlord", "Shadowlord", "Shadowlord", "Shadowlord", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi", "Shinobi" ]
        },
        Thief: {
            titles: ["Apprentice", "Thief Novice", "Thief Novice", "Thief Novice", "Rascal", "Rascal", "Rascal", "Rascal", "Rascal", "Footpad", "Footpad", "Footpad", "Footpad", "Footpad", "Pilferer", "Pilferer", "Pilferer", "Pilferer", "Pilferer", "Pickpocket", "Pickpocket", "Pickpocket", "Pickpocket", "Pickpocket", "Cutpurse", "Cutpurse", "Cutpurse", "Cutpurse", "Cutpurse", "Bandit", "Bandit", "Bandit", "Bandit", "Bandit", "Burglar", "Burglar", "Burglar", "Burglar", "Burglar", "Rogue", "Rogue", "Rogue", "Rogue", "Rogue", "Sharper", "Sharper", "Sharper", "Sharper", "Sharper", "Magsman", "Magsman", "Magsman", "Magsman", "Magsman", "Master", "Rogue", "Master", "Rogue", "Master", "Rogue", "Master", "Rogue", "Master", "Rogue", "Rogue Prince|Rogue Princess", "Rogue Prince|Rogue Princess", "Rogue Prince|Rogue Princess", "Rogue Prince|Rogue Princess", "Rogue Prince|Rogue Princess", "Underlord", "Underlord", "Underlord", "Underlord", "Underlord", "The Hand", "The Hand", "The Hand", "The Hand", "The Hand", "Deceiver", "Deceiver", "Deceiver", "Deceiver", "Deceiver", "Pillager", "Pillager", "Pillager", "Pillager", "Pillager", "Mastermind", "Mastermind", "Mastermind", "Mastermind", "Mastermind", "Con Artist", "Con Artist", "Con Artist", "Con Artist", "Con Artist", "Crime Lord", "Crime Lord", "Crime Lord", "Crime Lord", "Crime Lord", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin", "Kingpin" ]
        },
        Bard: {
            titles: ["Apprentice", "Bard Novice", "Bard Novice", "Bard Novice", "Jester", "Jester", "Jester", "Jester", "Jester", "Lyricist", "Lyricist", "Lyricist", "Lyricist", "Lyricist", "Entertainer", "Entertainer", "Entertainer", "Entertainer", "Entertainer", "Sonnateer", "Sonnateer", "Sonnateer", "Sonnateer", "Sonnateer", "Skald", "Skald", "Skald", "Skald", "Skald", "Troubadour", "Troubadour", "Troubadour", "Troubadour", "Troubadour", "Musician", "Musician", "Musician", "Musician", "Musician", "Minstrel", "Minstrel", "Minstrel", "Minstrel", "Minstrel", "Swashbuckler", "Swashbuckler", "Swashbuckler", "Swashbuckler", "Swashbuckler", "Songweaver", "Songweaver", "Songweaver", "Songweaver", "Songweaver", "Chanteur|Chanteuse", "Chanteur|Chanteuse", "Chanteur|Chanteuse", "Chanteur|Chanteuse", "Chanteur|Chanteuse", "Virtuoso", "Virtuoso", "Virtuoso", "Virtuoso", "Virtuoso", "Artiste", "Artiste", "Artiste", "Artiste", "Artiste", "Maestro", "Maestro", "Maestro", "Maestro", "Maestro", "Celebrity", "Celebrity", "Celebrity", "Celebrity", "Celebrity", "Royal Entertainer", "Royal Entertainer", "Royal Entertainer", "Royal Entertainer", "Royal Entertainer", "High Spellsong", "High Spellsong", "High Spellsong", "High Spellsong", "High Spellsong", "Prodigy", "Prodigy", "Prodigy", "Prodigy", "Prodigy", "Famous Dandy", "Famous Dandy", "Famous Dandy", "Famous Dandy", "Famous Dandy", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl", "Playboy|Playgirl" ]
        },
        Gypsy: {
            titles: ["Apprentice", "Gypsy Novice", "Gypsy Novice", "Gypsy Novice", "Scallywag", "Scallywag", "Scallywag", "Scallywag", "Scallywag", "Trickster", "Trickster", "Trickster", "Trickster", "Trickster", "Charlatan|Vixen", "Charlatan|Vixen", "Charlatan|Vixen", "Charlatan|Vixen", "Charlatan|Vixen", "Traveler", "Traveler", "Traveler", "Traveler", "Traveler", "Wanderer", "Wanderer", "Wanderer", "Wanderer", "Wanderer", "Wayfarer", "Wayfarer", "Wayfarer", "Wayfarer", "Wayfarer", "Nomad", "Nomad", "Nomad", "Nomad", "Nomad", "Voyager", "Voyager", "Voyager", "Voyager", "Voyager", "Arbiter", "Arbiter", "Arbiter", "Arbiter", "Arbiter", "Visionary", "Visionary", "Visionary", "Visionary", "Visionary", "Seer|Seeress", "Seer|Seeress", "Seer|Seeress", "Seer|Seeress", "Seer|Seeress", "Gypsy Prince|Gypsy Princess", "Gypsy Prince|Gypsy Princess", "Gypsy Prince|Gypsy Princess", "Gypsy Prince|Gypsy Princess", "Gypsy Prince|Gypsy Princess", "Lord of Fortune|Lady of Fortune", "Lord of Fortune|Lady of Fortune", "Lord of Fortune|Lady of Fortune", "Lord of Fortune|Lady of Fortune", "Lord of Fortune|Lady of Fortune", "Fortune's Hand", "Fortune's Hand", "Fortune's Hand", "Fortune's Hand", "Fortune's Hand", "Foreteller", "Foreteller", "Foreteller", "Foreteller", "Foreteller", "Vagabond Prince|Vagabond Princess", "Vagabond Prince|Vagabond Princess", "Vagabond Prince|Vagabond Princess", "Vagabond Prince|Vagabond Princess", "Vagabond Prince|Vagabond Princess", "High Artificier", "High Artificier", "High Artificier", "High Artificier", "High Artificier", "Vagrant Lord|Vagrant Lady", "Vagrant Lord|Vagrant Lady", "Vagrant Lord|Vagrant Lady", "Vagrant Lord|Vagrant Lady", "Vagrant Lord|Vagrant Lady", "Master of Fate|Mistress of Fate", "Master of Fate|Mistress of Fate", "Master of Fate|Mistress of Fate", "Master of Fate|Mistress of Fate", "Master of Fate|Mistress of Fate", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe", "Herald of Woe" ]
        },
        Warlock: {
            titles: ["Apprentice", "Warlock Novice", "Warlock Novice", "Warlock Novice", "Dabbler", "Dabbler", "Dabbler", "Dabbler", "Dabbler", "Spellslinger", "Spellslinger", "Spellslinger", "Spellslinger", "Spellslinger", "Occultist", "Occultist", "Occultist", "Occultist", "Occultist", "Cabalist", "Cabalist", "Cabalist", "Cabalist", "Cabalist", "Warrior Mage", "Warrior Mage", "Warrior Mage", "Warrior Mage", "Warrior Mage", "Erudite", "Erudite", "Erudite", "Erudite", "Erudite", "Rubicant", "Rubicant", "Rubicant", "Rubicant", "Rubicant", "Evoker", "Evoker", "Evoker", "Evoker", "Evoker", "Diabolist", "Diabolist", "Diabolist", "Diabolist", "Diabolist", "Spellbinder", "Spellbinder", "Spellbinder", "Spellbinder", "Spellbinder", "Swordsmage", "Swordsmage", "Swordsmage", "Swordsmage", "Swordsmage", "Battlemage", "Battlemage", "Battlemage", "Battlemage", "Battlemage", "Warmage", "Warmage", "Warmage", "Warmage", "Warmage", "Witchknight", "Witchknight", "Witchknight", "Witchknight", "Witchknight", "Djinn", "Djinn", "Djinn", "Djinn", "Djinn", "Runewielder", "Runewielder", "Runewielder", "Runewielder", "Runewielder", "Eldritch Knight", "Eldritch Knight", "Eldritch Knight", "Eldritch Knight", "Eldritch Knight", "High Battlemage", "High Battlemage", "High Battlemage", "High Battlemage", "High Battlemage", "Runic General", "Runic General", "Runic General", "Runic General", "Runic General", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus", "Supremus" ]
        },
        Mage: {
            titles: ["Apprentice", "Mage Novice", "Mage Novice", "Mage Novice", "Adept", "Adept", "Adept", "Adept", "Adept", "Prestidigator", "Prestidigator", "Prestidigator", "Prestidigator", "Prestidigator", "Illusionist", "Illusionist", "Illusionist", "Illusionist", "Illusionist", "Theurgist", "Theurgist", "Theurgist", "Theurgist", "Theurgist", "Conjurer", "Conjurer", "Conjurer", "Conjurer", "Conjurer", "Magician", "Magician", "Magician", "Magician", "Magician", "Sorcerer", "Sorcerer", "Sorcerer", "Sorcerer", "Sorcerer", "Arcanist", "Arcanist", "Arcanist", "Arcanist", "Arcanist", "Magus", "Magus", "Magus", "Magus", "Magus", "Wizard", "Wizard", "Wizard", "Wizard", "Wizard", "High Mage", "High Mage", "High Mage", "High Mage", "High Mage", "Archmage", "Archmage", "Archmage", "Archmage", "Archmage", "Lord Magus|Lady Magus", "Lord Magus|Lady Magus", "Lord Magus|Lady Magus", "Lord Magus|Lady Magus", "Lord Magus|Lady Magus", "Timebender", "Timebender", "Timebender", "Timebender", "Timebender", "Elder Wizard", "Elder Wizard", "Elder Wizard", "Elder Wizard", "Elder Wizard", "Grand Magus", "Grand Magus", "Grand Magus", "Grand Magus", "Grand Magus", "Supreme Archmagi", "Supreme Archmagi", "Supreme Archmagi", "Supreme Archmagi", "Supreme Archmagi", "Eldritch Lord|Eldritch Lady", "Eldritch Lord|Eldritch Lady", "Eldritch Lord|Eldritch Lady", "Eldritch Lord|Eldritch Lady", "Eldritch Lord|Eldritch Lady", "Arcane Conduit", "Arcane Conduit", "Arcane Conduit", "Arcane Conduit", "Arcane Conduit", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether", "Voice of the Aether" ]
        },
        Druid: {
            titles: ["Apprentice", "Druid Novice", "Druid Novice", "Druid Novice", "Naturalist", "Naturalist", "Naturalist", "Naturalist", "Naturalist", "Cultivator", "Cultivator", "Cultivator", "Cultivator", "Cultivator", "Herbalist", "Herbalist", "Herbalist", "Herbalist", "Herbalist", "Elementalist", "Elementalist", "Elementalist", "Elementalist", "Elementalist", "Nature's Servant", "Nature's Servant", "Nature's Servant", "Nature's Servant", "Nature's Servant", "Sage", "Sage", "Sage", "Sage", "Sage", "Savant", "Savant", "Savant", "Savant", "Savant", "Shaman|Shamaness", "Shaman|Shamaness", "Shaman|Shamaness", "Shaman|Shamaness", "Shaman|Shamaness", "Astromancer", "Astromancer", "Astromancer", "Astromancer", "Astromancer", "High Druid", "High Druid", "High Druid", "High Druid", "High Druid", "Archdruid", "Archdruid", "Archdruid", "Archdruid", "Archdruid", "Woodland Protector", "Woodland Protector", "Woodland Protector", "Woodland Protector", "Woodland Protector", "Lord of Nature|Lady of Nature", "Lord of Nature|Lady of Nature", "Lord of Nature|Lady of Nature", "Lord of Nature|Lady of Nature", "Lord of Nature|Lady of Nature", "Nature's Spirit", "Nature's Spirit", "Nature's Spirit", "Nature's Spirit", "Nature's Spirit", "Woodland Lord|Woodland Lady", "Woodland Lord|Woodland Lady", "Woodland Lord|Woodland Lady", "Woodland Lord|Woodland Lady", "Woodland Lord|Woodland Lady", "High Shaman", "High Shaman", "High Shaman", "High Shaman", "High Shaman", "Heart of the Wild", "Heart of the Wild", "Heart of the Wild", "Heart of the Wild", "Heart of the Wild", "Omnimancer", "Omnimancer", "Omnimancer", "Omnimancer", "Omnimancer", "Gaia's Chosen", "Gaia's Chosen", "Gaia's Chosen", "Gaia's Chosen", "Gaia's Chosen", "One with the Cosmos", "One with the Cosmos", "One with the Cosmos", "One with the Cosmos", "One with the Cosmos", "One with the Cosmos" ]
        },
        Ranger: {
            titles: ["Apprentice", "Ranger Novice", "Ranger Novice", "Ranger Novice", "Strider", "Strider", "Strider", "Strider", "Strider", "Excursionist", "Excursionist", "Excursionist", "Excursionist", "Excursionist", "Scout", "Scout", "Scout", "Scout", "Scout", "Explorer", "Explorer", "Explorer", "Explorer", "Explorer", "Guide", "Guide", "Guide", "Guide", "Guide", "Woodsman|Woodswoman", "Woodsman|Woodswoman", "Woodsman|Woodswoman", "Woodsman|Woodswoman", "Woodsman|Woodswoman", "Courser", "Courser", "Courser", "Courser", "Courser", "Tracker", "Tracker", "Tracker", "Tracker", "Tracker", "Pathfinder", "Pathfinder", "Pathfinder", "Pathfinder", "Pathfinder", "Hunter|Huntress", "Hunter|Huntress", "Hunter|Huntress", "Hunter|Huntress", "Hunter|Huntress", "Ranger Lord|Ranger Lady", "Ranger Lord|Ranger Lady", "Ranger Lord|Ranger Lady", "Ranger Lord|Ranger Lady", "Ranger Lord|Ranger Lady", "Master Hunter|Master Huntress", "Master Hunter|Master Huntress", "Master Hunter|Master Huntress", "Master Hunter|Master Huntress", "Master Hunter|Master Huntress", "Lord of the Hunt|Lady of the Hunt", "Lord of the Hunt|Lady of the Hunt", "Lord of the Hunt|Lady of the Hunt", "Lord of the Hunt|Lady of the Hunt", "Lord of the Hunt|Lady of the Hunt", "Nature's Fury", "Nature's Fury", "Nature's Fury", "Nature's Fury", "Nature's Fury", "Predator", "Predator", "Predator", "Predator", "Predator", "Dead Eye", "Dead Eye", "Dead Eye", "Dead Eye", "Dead Eye", "Ranger General", "Ranger General", "Ranger General", "Ranger General", "Ranger General", "Force of Nature", "Force of Nature", "Force of Nature", "Force of Nature", "Force of Nature", "Spear of the Wild", "Spear of the Wild", "Spear of the Wild", "Spear of the Wild", "Spear of the Wild", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar", "Primal Avatar" ]
        },
        Mystic: {
            titles: ["Apprentice", "Mystic Novice", "Mystic Novice", "Mystic Novice", "Student", "Student", "Student", "Student", "Student", "Disciple", "Disciple", "Disciple", "Disciple", "Disciple", "Seeker", "Seeker", "Seeker", "Seeker", "Seeker", "Monk", "Monk", "Monk", "Monk", "Monk", "Kai Warrior", "Kai Warrior", "Kai Warrior", "Kai Warrior", "Kai Warrior", "Monk Lord|Monk Lady", "Monk Lord|Monk Lady", "Monk Lord|Monk Lady", "Monk Lord|Monk Lady", "Monk Lord|Monk Lady", "Maharishi", "Maharishi", "Maharishi", "Maharishi", "Maharishi", "Sensei", "Sensei", "Sensei", "Sensei", "Sensei", "Guru", "Guru", "Guru", "Guru", "Guru", "Lama", "Lama", "Lama", "Lama", "Lama", "Master of the Way|Mistress of the Way", "Master of the Way|Mistress of the Way", "Master of the Way|Mistress of the Way", "Master of the Way|Mistress of the Way", "Master of the Way|Mistress of the Way", "Kai Lord|Kai Lady", "Kai Lord|Kai Lady", "Kai Lord|Kai Lady", "Kai Lord|Kai Lady", "Kai Lord|Kai Lady", "Kai Master|Kai Mistress", "Kai Master|Kai Mistress", "Kai Master|Kai Mistress", "Kai Master|Kai Mistress", "Kai Master|Kai Mistress", "Yogi", "Yogi", "Yogi", "Yogi", "Yogi", "Miyagi", "Miyagi", "Miyagi", "Miyagi", "Miyagi", "Kai Weaver", "Kai Weaver", "Kai Weaver", "Kai Weaver", "Kai Weaver", "Supreme Kai", "Supreme Kai", "Supreme Kai", "Supreme Kai", "Supreme Kai", "The Transcendent", "The Transcendent", "The Transcendent", "The Transcendent", "The Transcendent", "Essence of Kai", "Essence of Kai", "Essence of Kai", "Essence of Kai", "Essence of Kai", "The Ascended", "The Ascended", "The Ascended", "The Ascended", "The Ascended" ]
        }
    },
    races: [
        { id: "Human" },
        { id: "Dwarf" },
        { id: "Gnome" },
        { id: "Halfling" },
        { id: "Elf" },
        { id: "Dark-Elf" },
        { id: "Half-Elf" },
        { id: "Half-Orc" },
        { id: "Goblin" },
        { id: "Half-Ogre" },
        { id: "Kang" },
        { id: "Nekojin" },
        { id: "Gaunt One" }
    ],
};

async function generateData() {
  console.log('Generating default realm data');
  const realmData = await RealmData.create('default', defaultData);
  await realmData.save();
}

await generateData();

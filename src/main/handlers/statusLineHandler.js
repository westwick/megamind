import Handler from './Handler.js';

export default class StatusLineHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.eventBus.on('status-line', (line, matches) => {
      this.updateStatusLine(matches);
    });
  }

  updateStatusLine = (matches) => {
    const { hp, mana, statea, stateb, type } = matches;
  };
}

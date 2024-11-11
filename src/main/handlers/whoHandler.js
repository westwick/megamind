import Player from '../entities/Player.js';
import Handler from './Handler.js';

export default class WhoHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.eventBus.on('who-fantasy', async (lines, matches) => {
      const players = await this.updateFantasy(matches);

      if (players) {
        this.gameState.onlineUsers = players;
        this.eventBus.emit(
          'update-online-users',
          players.map((p) => p.name)
        );
      }
    });

    this.eventBus.on('who-technical', async (lines, matches) => {
      const players = await this.updateTechnical(matches);

      if (players) {
        this.gameState.onlineUsers = players;
        this.eventBus.emit(
          'update-online-users',
          players.map((p) => p.name)
        );
      }
    });
  }

  async updateFantasy(matches) {
    if (!matches) return;

    const players = matches.map(async (match) => {
      const [, alignment, first, last, flags, title, gang, status] = match;
      return await this.playerInfo(first, last, alignment, title, gang, flags, status);
    });

    return await Promise.all(players);
  }

  async updateTechnical(matches) {
    if (!matches) return;

    const players = await Promise.all(
      matches.map(async (match) => {
        const [, title, first, last, flags, alignment, gang, status] = match;
        return await this.playerInfo(first, last, alignment, title, gang, flags, status);
      })
    );

    return await Promise.all(players);
  }

  async playerInfo(first, last, alignment, title, gang, flags, status) {
    let player = await Player.find(first);

    if (!player) {
      player = await Player.create(first);
    }

    player.name = first;
    player.last = last;
    player.alignment = alignment;
    player.title = title;
    player.gang = gang;
    player.flags = flags;
    player.status = status;

    return await player.save();
  }
}

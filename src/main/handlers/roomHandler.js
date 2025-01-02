/* eslint-disable prettier/prettier */
import Handler from './Handler.js';

class RoomHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.potentialRoomName = null;
    // TODO -- add an event subscription to outbound commands to check
    //   and set state for when we are looking into another room
    this.eventBus.on('new-room-name', (roomName) => {
      this.potentialRoomName = roomName;
    });

    this.eventBus.on('new-room-items', (items) => {
      this.potentialRoomItems = items;
    });

    this.eventBus.on('new-room-entities', (entities) => {
      this.potentialRoomEntities = entities;
    });

    this.eventBus.on('new-room-exits', (exits) => {
      if (this.potentialRoomName) {
        const roomEvent = {
          roomName: this.potentialRoomName,
          items: this.potentialRoomItems,
          entities: this.potentialRoomEntities,
          exits: exits,
        };

        this.eventBus.emit('new-room', roomEvent);
        this.potentialRoomName = null;
        this.potentialRoomItems = null;
        this.potentialRoomEntities = null;
      }
    });

    this.eventBus.on('new-message-line', (event) => {
      try {
        this.updateRoomName(event.message);
        this.updateRoomItems(event);
        this.updateRoomEntities(event);
        this.updateRoomExits(event.message);
        this.handleEntityEnteringRoom(event);
      } catch (error) {
        console.error('[roomHandler] Error processing line:', error);
      }
    });

    this.eventBus.on('new-room', (event) => {
      this.handleAutoGetItems(event);
    });

  }

  updateRoomExits = (message) => {
    if (
      message.spans &&
      message.spans.length == 1 &&
      message.spans[0].color &&
      message.spans[0].color.name == 'green'
    ) {
      const exitString = message.spans[0].text.replace(/[A-Z]\b./g, '');
      const exitsPart = exitString.split(':')[1];
      if (exitsPart) {
        const exits = exitsPart
          .trim()
          .split(',')
          .map((exit) => exit.trim());

        this.eventBus.emit('new-room-exits', exits);
      }
    }
  };

  updateRoomName = (message) => {
    // Update room name
    if (
      message.spans &&
      message.spans.length == 1 &&
      message.spans[0].color &&
      message.spans[0].color.bright &&
      message.spans[0].color.name === 'cyan'
    ) {
      this.eventBus.emit('new-room-name', message.spans[0].text);
    }
  };

  /*
  updateRoomItems = (event) => {
    const message = event.message;
    if (
      message.spans &&
      message.spans[0].color &&
      message.spans[0].color.name == 'cyan' &&
      event.line.startsWith('You notice')
    ) {
      const itemsPart = event.line.split('You notice')[1].trim();
      const items = itemsPart.split(',').map((item) => item.trim().replace(/ here\.$/, ''));

      this.eventBus.emit('new-room-items', items);
    }
  };
  */

  updateRoomEntities = (event) => {
    if (
      event.message.spans &&
      event.message.spans[0].color &&
      event.message.spans[0].color.name == 'magenta' &&
      event.line.startsWith('Also here:')
    ) {
      const entitiesPart = event.line.split('Also here:')[1].trim();

      const entities = entitiesPart.split(', ').filter((entity) => entity !== '');

      // delete the trailing period from the last entity
      entities[entities.length - 1] = entities[entities.length - 1].replace('.', '');

      this.eventBus.emit('new-room-entities', entities);
    }
  };

  handleEntityEnteringRoom = (event) => {
    const message = event.message;
    if (message.spans && message.spans.length >= 2) {
      for (let i = 0; i < message.spans.length - 1; i++) {
        const currentSpan = message.spans[i];
        const nextSpan = message.spans[i + 1];

        if (
          currentSpan.color &&
          currentSpan.color.name === 'yellow' &&
          currentSpan.color.bright &&
          nextSpan.color &&
          nextSpan.color.name === 'green'
        ) {
          let entityName = currentSpan.text.trim();
          // Remove "A " or "An " from the beginning if present
          entityName = entityName.replace(/^(A|An)\s+/i, '');
          // Remove any trailing characters (like periods)
          entityName = entityName.replace(/\.$/, '');

          // instead of updating everything again, lets just look in the current room
          // and let the other room update handle the rest
          this.commandManager.sendCommand('');
          break; // Exit the loop once we've found and processed the entity
        }
      }
    }
  };

  // this should be moved somewhere else, "itemHandler" ?
  handleAutoGetItems = (event) => {
    if (event.items && event.items.length > 0) {
      event.items.forEach((item) => {
        if (item.includes('silver') || item.includes('copper')) {
          this.commandManager.sendCommand(`get ${item}`);
        }
      });
    }
  };
}

export default RoomHandler;

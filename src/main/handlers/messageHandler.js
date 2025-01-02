/* eslint-disable prettier/prettier */
import Handler from './Handler.js';

class MessageHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.setupEventListeners();
  }

  setupEventListeners = () => {
    this.eventBus.on("process-messages", this.processMessages.bind(this));
  };

  processMessages = (messages) => {
  //  console.log(messages)
    messages.forEach((value, key) => {
      switch (key) {
        case 'room':
          this.eventBus.emit('update-room-stats', messages.get(key));
          break;
        case 'statusLine' :
          this.eventBus.emit('update-status-line', messages.get(key));
          break;
        default :
          break;
      }
    });
  }
}

export default MessageHandler;

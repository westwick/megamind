const gameState = require('../gameState');

class MudAutomator {
  constructor(telnetSocket, debugCallback) {
    console.log('MudAutomator started');
    this.telnetSocket = telnetSocket;
    this.debugCallback = debugCallback;
    this.rawDataBuffer = [];
    this.messageBuffer = '';
    this.splitPattern = '[79D\u001b[K\u001b[0;37m[HP=';
    this.maxRawDataBufferSize = 10; // Store last 10 raw data chunks
  }

  debug(info) {
    if (this.debugCallback) {
      this.debugCallback(info);
    }
  }

  parse(data) {
    console.log('data received:', data.toString());

    // Store raw data
    this.rawDataBuffer.push(data.toString());
    if (this.rawDataBuffer.length > this.maxRawDataBufferSize) {
      this.rawDataBuffer.shift();
    }

    // Process the data
    this.messageBuffer += data.toString();
    const parts = this.messageBuffer.split(this.splitPattern);

    // Process all complete messages
    while (parts.length > 1) {
      const completeMessage = parts.shift();
      this.processMessage(completeMessage);
    }

    // Keep the last (potentially incomplete) part in the buffer
    this.messageBuffer = parts[0];

    // Debug information
    this.debug({
      rawDataBufferLength: this.rawDataBuffer.length,
      messageBufferLength: this.messageBuffer.length,
      lastProcessedMessage: parts[0]
    });
  }

  processMessage(message) {
    const lines = message.split('\n');
    for (let line of lines) {
      if (line.trim()) {
        this.handleMUDCommands(line);
        this.updateRoomInfo(line);
      }
    }
  }

  handleMUDCommands(line) {
    // Add MUD-specific command handling here
    // For example:
    if (line.includes('You are hungry')) {
      this.sendCommand('eat food');
    }
    
    // Handle "Obvious exits" information
    if (line.includes('Obvious exits:')) {
      const exitsPart = line.split(':')[1];
      if (exitsPart) {
        const exits = exitsPart.trim().split(',')
          .map(exit => exit.trim())
          .map(exit => exit.replace(/[A-Z]\b./g, ''));  // Remove uppercase letter, backspace, and following character
        console.log('Obvious exits:', exits);
        gameState.currentRoom.exits = exits;
        
      }
    }
  }

  updateRoomInfo(line) {
    // Example: Update room information based on ANSI color codes
    if (line.includes('[1;36m')) { // Bright teal color for room name
      const roomName = line.split('[1;36m')[1].split('[0m')[0].trim();
      console.log('Room Name:', roomName);
      gameState.currentRoom.name = roomName;
    }

    // Add more conditions for other room information (exits, map number, room number)
    // based on their specific ANSI color codes or patterns
  }

  sendCommand(command) {
    this.telnetSocket.write(Buffer.from(command + '\r', 'utf8'));
  }
}

module.exports = MudAutomator;
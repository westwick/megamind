const gameState = require('../gameState');

class MudAutomator {
  constructor(telnetSocket) {
    console.log('MudAutomator constructor');
    this.telnetSocket = telnetSocket;
  }

  parse(data) {
    const text = data.toString();
    const lines = text.split('\n');
    console.log('fulltext:\n\n', text);

    for (let line of lines) {
      const cleanLine = this.stripAnsi(line).trim();
      this.handleMUDCommands(cleanLine);
      this.updateRoomInfo(cleanLine);
    }
  }

  handleMUDCommands(line) {
    // Add MUD-specific command handling here
    // For example:
    if (line.includes('You are hungry')) {
      this.sendCommand('eat food');
    }
  }

  updateRoomInfo(line) {
    // Example: Update room information based on a specific pattern
    const roomPattern = /Room: (.+), Exits: (.+), Map: (\d+), Room: (\d+)/;
    const match = line.match(roomPattern);
    if (match) {
      const [_, name, exits, mapNumber, roomNumber] = match;
      gameState.updateRoom(name, exits.split(','), parseInt(mapNumber), parseInt(roomNumber));
      console.log('Updated room info:', gameState.currentRoom);
    }
  }

  stripAnsi(str) {
    return str.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
  }

  sendCommand(command) {
    this.telnetSocket.write(Buffer.from(command + '\r', 'utf8'));
  }
}

module.exports = MudAutomator;
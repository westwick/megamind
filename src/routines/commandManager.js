class CommandManager {
  constructor(telnetSocket) {
    this.telnetSocket = telnetSocket;
    this.commandHistory = [];
    this.maxHistorySize = 10;
    this.movementCommands = new Set([
      "e",
      "w",
      "s",
      "n",
      "se",
      "sw",
      "ne",
      "nw",
      "u",
      "d",
    ]);
  }

  sendCommand(command) {
    const now = Date.now();

    // If it's a movement command, send it immediately
    if (this.isMovementCommand(command)) {
      this.sendCommandImmediate(command, now);
      return;
    }

    // If the command history is empty or the last command was sent more than 500ms ago,
    // send the command immediately
    if (
      this.commandHistory.length === 0 ||
      now - this.commandHistory[0].timestamp > 500
    ) {
      this.sendCommandImmediate(command, now);
      return;
    }

    // Check against the recent command history
    for (const entry of this.commandHistory) {
      if (entry.command === command && now - entry.timestamp < 500) {
        console.log("Skipping duplicate command:", command);
        return;
      }

      // If we've reached a command older than 500ms, we can stop checking
      if (now - entry.timestamp > 500) {
        break;
      }
    }

    // If we've made it here, the command is not a recent duplicate
    this.sendCommandImmediate(command, now);
  }

  sendCommandImmediate(command, timestamp) {
    this.telnetSocket.write(command + "\r");

    // Add the command to the history
    this.commandHistory.unshift({ command, timestamp });

    // Trim the history if it exceeds the maximum size
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.pop();
    }
  }

  isMovementCommand(command) {
    return this.movementCommands.has(command.toLowerCase().trim());
  }
}

export default CommandManager;

export class LoginAutomator {
  constructor(gameState, telnetSocket, onLoginComplete, username, password) {
    this.gameState = gameState;
    this.telnetSocket = telnetSocket;
    this.onLoginComplete = onLoginComplete;
    this.loginInfo = { username, password };
  }

  parse = (data) => {
    const text = data.dataTransformed;
    const lines = text.split("\n");
    const lastLine = this.stripAnsi(lines[lines.length - 1]).trim();

    if (!this.gameState.isLoggedIn) {
      this.handleLogin(lastLine);
    }

    if (this.gameState.isLoggedIn && !this.gameState.hasEnteredGame) {
      this.handleGameEntry(lastLine);
    }

    if (lastLine.includes("(N)onstop, (Q)uit, or (C)ontinue?")) {
      this.sendCommand("");
    }

    // Scan all lines for specific content
    lines.forEach((line) => {
      const cleanLine = this.stripAnsi(line).trim();
      this.scanForSpecificContent(cleanLine);
    });

    // Check if login automation is complete
    if (this.gameState.isLoggedIn && this.gameState.hasEnteredGame) {
      this.onLoginComplete(this.telnetSocket);
    }
  };

  handleLogin = (lastLine) => {
    if (lastLine.includes('Otherwise type "new":')) {
      this.sendCommand(this.loginInfo.username);
    }

    if (lastLine.includes("Enter your password:")) {
      this.sendCommand(this.loginInfo.password);
      this.gameState.setState({ isLoggedIn: true });
    }
  };

  handleGameEntry = (lastLine) => {
    if (lastLine.includes("[MAJORMUD]:")) {
      this.sendCommand("enter");
      this.gameState.setState({ hasEnteredGame: true });
    }
  };

  scanForSpecificContent = (line) => {
    if (
      line.includes("Make your selection") &&
      !this.gameState.hasSentCustomCommand
    ) {
      this.sendCommand("/go majormud");
      this.gameState.hasSentCustomCommand = true;
    }
  };

  stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*[JKmsu]/g, "");

  sendCommand = (command) => {
    this.telnetSocket.write(command + "\r");
  };
}

const gameState = require('../gameState');

class LoginAutomator {
    constructor(telnetSocket, onLoginComplete) {
      this.telnetSocket = telnetSocket;
      this.onLoginComplete = onLoginComplete;
      this.loginInfo = {
        username: 'megamind',
        password: 'tester1'
      };
    }
  
    parse(data) {
      const text = data.toString()
      const lines = text.split('\n');
      const lastLine = this.stripAnsi(lines[lines.length - 1]).trim();
      console.log("fulltext:\n\n", text);

      if (!gameState.isLoggedIn) {
        this.handleLogin(lastLine);
      }

      if (gameState.isLoggedIn && !gameState.hasEnteredGame) {
        this.handleGameEntry(lastLine);
      }

      if (lastLine.includes('(N)onstop, (Q)uit, or (C)ontinue?')) {
        this.sendCommand('');
      }

      // Scan all lines for specific content
      for (let line of lines) {
        const cleanLine = this.stripAnsi(line).trim();
        this.scanForSpecificContent(cleanLine);
      }

      // Check if login automation is complete
      if (gameState.isLoggedIn && gameState.hasEnteredGame) {
        this.onLoginComplete();
      }
    }

    handleLogin(lastLine) {
      if (lastLine.includes('Otherwise type "new":')) {
        this.sendCommand(this.loginInfo.username);
      }

      if (lastLine.includes('Enter your password:')) {
        this.sendCommand(this.loginInfo.password);
        gameState.isLoggedIn = true;
      }
    }

    handleGameEntry(lastLine) {
      if (lastLine.includes('[MAJORMUD]:')) {
        this.sendCommand('enter');
        gameState.hasEnteredGame = true;
      }
    }

    scanForSpecificContent(line) {
      if (line.includes('Make your selection') && !gameState.hasSentCustomCommand) {
        this.sendCommand('\/go majormud');
        gameState.hasSentCustomCommand = true;
      }
    }

    stripAnsi(str) {
      return str.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
    }
  
    sendCommand(command) {
      this.telnetSocket.write(Buffer.from(command + '\r', 'utf8'));
    }
    
  }
  
  module.exports = LoginAutomator;
import playerConfig from '../state/playerConfig';
import { writeToTerminal } from '../index';
import '../util/Extensions.js';
import Automator from './Automator';

export default class LoginAutomator extends Automator {
  parse = (data) => {
    const text = data.dataTransformed;
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1].stripAnsi().trim();

    if (!this.gameState.isLoggedIn) {
      if (this.handleLogin(lastLine)) {
        this.gameState.setState({ isLoggedIn: true });
      }
    }

    if (this.gameState.isLoggedIn && !this.gameState.hasEnteredGame) {
      if (this.handleGameEntry(lastLine)) {
        this.gameState.setState({ hasEnteredGame: true });
      }
    }

    // TODO: we should remove this and just use the config
    // Scan all lines for specific content
    lines.forEach((line) => {
      const cleanLine = line.stripAnsi().trim();
      this.scanForSpecificContent(cleanLine);
    });

    // Check if login automation is complete
    if (this.gameState.isLoggedIn && this.gameState.hasEnteredGame) {
      this.main.onLoginComplete();
    }
  };

  handleLogin = (lastLine) => {
    const loginSteps = this.realmConfig.login || [];
    const matchingStep = loginSteps.find((step) => lastLine.startsWith(step.message));

    if (matchingStep) {
      const command = matchingStep.command.substitute(this.userConfig);
      this.sendCommand(command);
    } else {
      // we have moved on to game entry
      const gameEntrySteps = this.realmConfig.gameEntry || [];
      const matchingStep = gameEntrySteps.find((step) => lastLine.startsWith(step.message));

      return matchingStep;
    }

    return false;
  };

  handleGameEntry = (lastLine) => {
    const gameEntrySteps = this.realmConfig.gameEntry || [];
    const matchingStep = gameEntrySteps.find((step) => lastLine.startsWith(step.message));

    if (matchingStep) {
      const config = playerConfig.getConfig();

      if (config.auto.autoAll === true) {
        const command = matchingStep.command.substitute(this.userConfig);
        // TODO: game entry should really be when we detect the status line
        this.sendCommand(command);
        return true;
      } else {
        writeToTerminal('AutoAll is not enabled. Waiting for manual entry.');
      }
    }

    return false;
  };

  scanForSpecificContent = (line) => {
    if (line.includes('Make your selection') && !this.gameState.hasSentCustomCommand) {
      this.sendCommand('/go majormud');
      this.gameState.hasSentCustomCommand = true;
    }
  };

  sendCommand = (command) => {
    if (this.socket) {
      this.socket.write(command + '\r');
    }
  };
}

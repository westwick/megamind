import { EventEmitter } from 'events';
import net from 'net';
import iconv from 'iconv-lite';

import Configuration from './state/Configuration';
import GameState from './state/gameState';
import PlayerStats from './state/playerStats';
import LoginAutomator from './routines/loginAutomator';
import MudAutomator from './routines/mudAutomator';

export default class MegaMindInstance extends EventEmitter {
  #userConfig;
  #realmConfig;

  get userConfig() {
    return this.#userConfig;
  }

  get realmConfig() {
    return this.#realmConfig;
  }

  constructor(mainWindow, userConfig, realmConfig) {
    super();

    this.config = new Configuration('megamind.yaml');
    this.mainWindow = mainWindow;

    this.#userConfig = userConfig;
    this.#realmConfig = realmConfig;

    this.gameState = new GameState(this);
    this.playerStatsInstance = PlayerStats;
    this.playerStatsInstance.startSession();

    this.forwardEventToRenderer('game-state-updated');
  }

  connect(event) {
    this.socket = net.createConnection(this.realmConfig.bbs.port, this.realmConfig.bbs.host);

    this.socket.on('connect', () => {
      if (this.socket) {
        this.socket.noDelay = true;

        this.currentRoutine = new LoginAutomator(this);

        event.reply('server-connected');
      }
    });

    this.socket.on('data', (data) => {
      let transformedData = iconv.decode(data, 'cp437');

      // insert cursor reset to top after clear screen
      // this is how older terminals behaved
      // fixes alignment issue for the "train stats" screen so content is always at top
      if (transformedData.includes('\x1b[2J')) {
        transformedData = transformedData.replace(
          '\x1b[2J',
          '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\x1b[2J\x1b[H'
        );
      }

      const dataEvent = {
        dataRaw: data,
        dataTransformed: transformedData,
      };
      event.reply('server-data', dataEvent);

      if (this.currentRoutine) {
        this.currentRoutine.parse(dataEvent);

        if (this.currentRoutine instanceof MudAutomator) {
          // window.electronAPI.updateRoom(gameState.currentRoom);
        }
      }
    });

    this.socket.on('close', () => {
      event.reply('server-closed');
    });

    this.socket.on('error', (err) => {
      console.error('Socket error: ', err);
      event.reply('server-error', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
  }

  send(data) {
    this.socket.write(data);
  }

  forwardEventToRenderer(eventName) {
    this.on(eventName, (data) => {
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send(eventName, data);
      }
    });
  }

  onLoginComplete() {
    this.currentRoutine = new MudAutomator(this);

    this.forwardEventToRenderer('conversation');
    this.forwardEventToRenderer('update-player-stats');
    this.forwardEventToRenderer('new-room');
    this.forwardEventToRenderer('update-online-users');
  }

  writeToTerminal(data) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('terminal-write', data);
    }
  }
}

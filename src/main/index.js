import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import net from 'net';
import iconv from 'iconv-lite';

import MudAutomator from './routines/mudAutomator.js';
import LoginAutomator from './routines/loginAutomator.js';
import GameState from './state/gameState.js';
import { PlayerStats } from './state/playerStats.js';
import Configuration from './state/newConfig.js';
import { EventEmitter } from 'events';
import sourceMapSupport from 'source-map-support';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.env.ELECTRON_SQUIRREL_STARTUP) {
  app.quit();
}
sourceMapSupport.install();

let main;
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: Math.max(1024, Math.floor(screen.getPrimaryDisplay().workAreaSize.width * 0.85)),
    height: Math.max(768, Math.floor(screen.getPrimaryDisplay().workAreaSize.height * 0.85)),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      //contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log('app ready');
  createWindow();
  console.log('creating main');
  main = new Main('soul.yaml', 'paradigm.yaml');
  mainWindow.webContents.openDevTools();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('load-config', () => {
  // no need to load config, it auto reloads
});

class Main extends EventEmitter {
  #userConfig;
  #realmConfig;

  get userConfig() {
    return this.#userConfig;
  }

  get realmConfig() {
    return this.#realmConfig;
  }

  constructor(userConfigPath, realmConfigPath) {
    super();

    try {
      // TODO: add in schema validation
      this.#userConfig = new Configuration(userConfigPath);
      this.#realmConfig = new Configuration(realmConfigPath);
    } catch (e) {
      writeToTerminal('Error loading config: ' + e);
    }

    this.gameState = new GameState(this);
    this.playerStatsInstance = new PlayerStats(this);
    this.playerStatsInstance.startSession();

    this.forwardEventToRenderer('game-state-updated');
  }

  connect(event) {
    this.socket = net.createConnection(this.realmConfig.bbs.port, this.realmConfig.bbs.host);

    this.socket.on('connect', () => {
      this.socket.noDelay = true;

      this.currentRoutine = new LoginAutomator(this);

      event.reply('server-connected');
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
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(eventName, data);
      }
    });
  }

  onLoginComplete() {
    this.currentRoutine = new MudAutomator(main);

    this.forwardEventToRenderer('conversation');
    this.forwardEventToRenderer('update-player-stats');
    this.forwardEventToRenderer('new-room');
    this.forwardEventToRenderer('update-online-users');
  }
}

ipcMain.on('connect-to-server', (event) => {
  // TODO: handle UI events loading a configuration instead of hardcoding
  main.connect(event);
});

ipcMain.on('send-data', (event, data) => {
  main.send(data);
});

ipcMain.handle('get-player-config', () => {
  return main.config.options;
});

ipcMain.on('update-player-config', (event, section, sectionData) => {
  main.playerConfig.updateConfig(section, sectionData);
});

ipcMain.on('disconnect-from-server', (event) => {
  console.log('disconnecting from server at ' + new Date().toISOString());
  main.disconnect();
});

export const writeToTerminal = (data) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('terminal-write', data);
  }
};

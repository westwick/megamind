import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import sourceMapSupport from 'source-map-support';

import MegaMindInstance from './MegaMindInstance.js';
import Configuration from './state/Configuration.js';

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

  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.on('client-loaded', () => {
  initialize();
});

function initialize() {
  try {
    let userConfig = Configuration.resolve('user.yaml') || Configuration.resolve('user-default.yaml');
    let realmConfig = Configuration.resolve('realm.yaml') || Configuration.resolve('realm-default.yaml');

    if (!userConfig) {
      writeToTerminal('No user config file found, halting.');
      return;
    }

    if (!realmConfig) {
      writeToTerminal('No realm config file found, halting.');
      return;
    }

    if (path.basename(userConfig) === 'user-default.yaml') {
      writeToTerminal('Using default user config.');
      writeToTerminal('Please copy resources/user-default.yaml to user.yaml to configure your user.');
    }

    if (path.basename(realmConfig) === 'realm-default.yaml') {
      writeToTerminal('Using default realm config.');
      writeToTerminal('Please copy resources/realm-default.yaml to realm.yaml to configure your realm.');
    }

    main = new MegaMindInstance(mainWindow, userConfig, realmConfig);
  } catch (e) {
    writeToTerminal('Error loading config: ' + e);
    console.error(e);
  }
}

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

ipcMain.on('connect-to-server', (event) => {
  // TODO: handle UI events loading a configuration instead of hardcoding
  main.connect(event);
});

ipcMain.on('send-data', (event, data) => {
  main.send(data);
});

ipcMain.handle('get-player-config', () => {
  if (main) {
    return main.userConfig.options;
  }

  return undefined;
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

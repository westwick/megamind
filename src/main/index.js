import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import yaml from 'yaml';
import sourceMapSupport from 'source-map-support';

import { createMenu } from './menu.js';

import MegaMindInstance from './MegaMindInstance.js';
import Configuration from './state/Configuration.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.env.ELECTRON_SQUIRREL_STARTUP) {
  app.quit();
}
sourceMapSupport.install();

let main;
let config;
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: Math.max(1024, Math.floor(screen.getPrimaryDisplay().workAreaSize.width * 0.85)),
    height: Math.max(768, Math.floor(screen.getPrimaryDisplay().workAreaSize.height * 0.85)),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
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

  createMenu();
});

// This is called when the client has loaded and is ready to initialize
ipcMain.on('client-loaded', () => {
  initialize();
});

// This is called when the user selects a profile from the dropdown
ipcMain.on('load-profile', (event, profile) => {
  config.megamind = { ...config.megamind, lastSelectedProfile: profile };
  config.save();

  const userConfig = new Configuration(profile, {
    realms: path.join(app.getAppPath(), 'resources', 'realms'),
  });

  if (!userConfig.realm || !fs.existsSync(userConfig.realm)) {
    writeToTerminal('No realm config specified or file not found.');
    return;
  }

  const realmConfig = new Configuration(userConfig.realm);

  // TODO: if we already have a main instance, we should reuse it
  main = new MegaMindInstance(mainWindow, userConfig, realmConfig);
  writeToTerminal('Loaded profile: ' + path.basename(profile));
  mainWindow.webContents.send('set-selected-profile', profile, userConfig.options);
  mainWindow.webContents.send('enable-connect');
});

function initialize() {
  const configPath = Configuration.resolve('megamind.yaml');

  if (!configPath) {
    writeToTerminal('Megamind Configuration not found.');
    writeToTerminal("Ensure 'megamind.yaml' exists in the application resources directory.");
    mainWindow.webContents.send('disable-connect');
    return;
  }

  config = new Configuration(configPath);

  if (config.megamind.lastSelectedProfile) {
    ipcMain.emit('load-profile', null, config.megamind.lastSelectedProfile);
    return;
  }

  const profilesPath = path.join(app.getAppPath(), 'resources', 'profiles');

  try {
    const files = fs.readdirSync(profilesPath);
    const yamlFiles = files.filter((f) => f.endsWith('.yaml'));

    if (yamlFiles.length === 0) {
      writeToTerminal('No profile files found.');
      writeToTerminal(`Add .yaml files to: ${profilesPath}`);
      return;
    }
  } catch (err) {
    writeToTerminal('No profile files found.');
    writeToTerminal(`Add .yaml files to: ${profilesPath}`);
    return;
  }

  writeToTerminal('Select a profile in the upper right.');
  mainWindow.webContents.send('disable-connect');
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

ipcMain.handle('create-new-profile', () => {
  const defaultProfile = Configuration.resolve('user-default.yaml');

  if (!defaultProfile) {
    writeToTerminal('No default profile found.');
    writeToTerminal("Ensure 'user-default.yaml' exists in the application resources directory." );
    return;
  }

  const defaultConfig = new Configuration(defaultProfile);
  //const newProfilePath = path.join(app.getAppPath(), 'resources', 'profiles', `${defaultConfig.user.name}.yaml`);
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

ipcMain.handle('get-player-profiles', () => {
  const profilesPath = path.join(app.getAppPath(), 'resources', 'profiles');
  const profiles = [];

  try {
    const files = fs.readdirSync(profilesPath);

    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const filePath = path.join(profilesPath, file);
          const config = yaml.parse(fs.readFileSync(filePath, 'utf8'));

          if (config && config.user && config.user.name) {
            profiles.push({
              name: config.user.name,
              fileName: file,
              path: filePath,
              character: config.character,
            });
          }
        } catch (err) {
          console.error(`Error loading profile ${file}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error reading profiles directory:', err);
  }

  return profiles;
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

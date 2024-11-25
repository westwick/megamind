import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import sourceMapSupport from 'source-map-support';

import { createMenu } from './menu.js';

import MegaMindInstance from './MegaMindInstance.js';
import Configuration from './state/Configuration.js';

const appPaths = {
  app: app.getPath('userData'),
  resources: path.join(app.getPath('userData'), 'resources'),
  state: path.join(app.getPath('userData'), 'resources', 'state'),
  realms: path.join(app.getPath('userData'), 'resources', 'realms'),
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.env.ELECTRON_SQUIRREL_STARTUP) {
  app.quit();
}
sourceMapSupport.install();

let main;
let megamindConfig;
let mainWindow;

// WINDOW CREATION

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

// CODE

function initialize() {
  // Load the megamind config and halt if not found
  const megamindConfigPath = Configuration.resolve('megamind.yaml');

  megamindConfig = new Configuration(megamindConfigPath, appPaths);
  megamindConfig.save(path.join(appPaths.resources, 'megamind.yaml'));

  // load the last selected profile if it exists
  if (megamindConfig.lastSelectedProfile && fs.existsSync(megamindConfig.lastSelectedProfile)) {
    return loadProfile(megamindConfig.lastSelectedProfile);
  }

  // TODO: visual indicate where to create or select a profile
  writeToTerminal('Create or select a profile in the upper right.');
  mainWindow.webContents.send('disable-connect');
}

function loadProfile(profilePath) {
  megamindConfig.lastSelectedProfile = profilePath;
  megamindConfig.save();

  const userConfig = new Configuration(profilePath, appPaths);

  if (!fs.existsSync(userConfig.realm)) {
    const defaultBbsProfle = Configuration.resolve('realm-default.yaml');
    const bbsConfig = new Configuration(defaultBbsProfle, appPaths);
    bbsConfig.save(userConfig.realm);
    writeToTerminal('Created default realm config: ' + userConfig.realm + ' please modify as needed.');
  }

  const realmConfig = new Configuration(userConfig.realm, appPaths);

  if (main) {
    main.updateUserOptions(userConfig.options, false);
  } else {
    main = new MegaMindInstance(mainWindow, userConfig, realmConfig, megamindConfig);
  }

  writeToTerminal('Loaded profile: ' + path.basename(profilePath));
  mainWindow.webContents.send('set-selected-profile', profilePath, userConfig.serializedOptions);
  mainWindow.webContents.send('enable-connect');
}

function createProfile() {
  const defaultProfile = Configuration.resolve('user-default.yaml');

  if (!defaultProfile) {
    writeToTerminal('No default profile found.');
    writeToTerminal("Ensure 'user-default.yaml' exists in the application resources directory.");
    return;
  }

  const defaultConfig = new Configuration(defaultProfile, appPaths);

  const newProfilePath = path.join(app.getPath('userData'), 'resources', 'profiles');
  const newProfileName = path.join(newProfilePath, `${new Date().toISOString()}.yaml`);

  if (!fs.existsSync(newProfilePath)) {
    fs.mkdirSync(newProfilePath, { recursive: true });
  }

  defaultConfig.save(newProfileName);

  const bbsPath = path.join(app.getPath('userData'), 'resources', 'realms');
  const bbsName = path.join(bbsPath, 'bbs.yaml');

  if (!fs.existsSync(bbsName)) {
    if (!fs.existsSync(bbsPath)) {
      fs.mkdirSync(bbsPath, { recursive: true });
    }

    const defaultBbsProfle = Configuration.resolve('realm-default.yaml');
    const bbsConfig = new Configuration(defaultBbsProfle, appPaths);
    bbsConfig.save(bbsName);
  }

  return { path: newProfileName, options: defaultConfig.serializedOptions };
}

// IPC Handlers

// This is called when the client has loaded and is ready to initialize
ipcMain.on('client-loaded', () => {
  initialize();
});

// This is called when the user selects a profile from the dropdown
ipcMain.on('load-profile', (event, profile) => {
  loadProfile(profile);
});

ipcMain.on('save-profile', (event, config, save) => {
  if (main) {
    main.updateUserOptions(config, save);
  }
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

ipcMain.handle('create-new-profile', () => {
  return createProfile();
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
    return main.userConfig.serializedOptions;
  }

  return undefined;
});

ipcMain.handle('get-player-profiles', () => {
  const profilesPath = path.join(app.getPath('userData'), 'resources', 'profiles');
  const profiles = [];

  try {
    if (!fs.existsSync(profilesPath)) {
      return profiles;
    }

    const files = fs.readdirSync(profilesPath);

    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        try {
          const profile = new Configuration(path.join(profilesPath, file), appPaths);

          if (profile) {
            profiles.push({
              path: profile.filename,
              options: profile.serializedOptions,
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

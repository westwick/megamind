const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("node:path");
const net = require("net");
const iconv = require("iconv-lite");
import { MudAutomator } from "./routines/mudAutomator.js";
import { LoginAutomator } from "./routines/loginAutomator.js";
import { GameState } from "./state/gameState.js";
import { PlayerStats } from "./state/playerStats.js";
import playerConfig from "./state/playerConfig.js";
import { EventEmitter } from "events";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
import sourceMapSupport from "source-map-support";
sourceMapSupport.install();

let mainWindow;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
let config = null;
function loadConfig() {
  try {
    if (!config) {
      const configPath = path.join(app.getAppPath(), "config.json");
      const configData = fs.readFileSync(configPath, "utf8");
      config = JSON.parse(configData);
    }
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
  }
}

ipcMain.handle("load-config", () => {
  return loadConfig();
});

let socket;
let currentRoutine = null;
let gameState;
let playerStatsInstance;
let eventBus = new EventEmitter();
forwardEventToRenderer("game-state-updated");

ipcMain.on("connect-to-server", (event) => {
  initializeGame();

  socket = net.createConnection(config.port, config.server, () => {
    event.reply("server-connected");
  });

  socket.on("data", (data) => {
    let transformedData = iconv.decode(data, "cp437");

    // insert cursor reset to top after clear screen
    // this is how older terminals behaved
    // fixes alignment issue for the "train stats" screen so content is always at top
    if (transformedData.includes("\x1b[2J")) {
      transformedData = transformedData.replace(
        "\x1b[2J",
        "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\x1b[2J\x1b[H"
      );
    }

    const dataEvent = {
      dataRaw: data,
      dataTransformed: transformedData,
    };
    event.reply("server-data", dataEvent);

    if (currentRoutine) {
      currentRoutine.parse(dataEvent);
      if (currentRoutine instanceof MudAutomator) {
        // window.electronAPI.updateRoom(gameState.currentRoom);
      }
    } else {
      currentRoutine = new LoginAutomator(
        gameState,
        socket,
        onLoginComplete,
        config.username,
        config.password
      );
    }
  });

  socket.on("close", () => {
    event.reply("server-closed");
  });

  socket.on("error", (err) => {
    console.error("Socket error: ", err);
    event.reply("server-error", err.message);
  });
});

ipcMain.on("send-data", (event, data) => {
  if (socket) {
    socket.write(data);
  }
});

ipcMain.handle("get-player-config", () => {
  return playerConfig.getConfig();
});

ipcMain.on("update-player-config", (event, section, sectionData) => {
  playerConfig.updateConfig(section, sectionData);
});

ipcMain.on("disconnect-from-server", (event) => {
  console.log("disconnecting from server at " + new Date().toISOString());
  disconnectFromServer();
});

function disconnectFromServer() {
  if (socket) {
    socket.end(() => {
      // writeToTerminal("Disconnected from server");
    });
    socket = null;
    currentRoutine = null;
  }
}

function initializeGame() {
  currentRoutine = null;
  config = loadConfig();
  gameState = new GameState(eventBus);
  playerStatsInstance = new PlayerStats(eventBus);
  playerStatsInstance.startSession();
}

function onLoginComplete() {
  console.log("Login automation complete");

  currentRoutine = new MudAutomator(
    socket,
    gameState,
    playerStatsInstance,
    eventBus
  );

  forwardEventToRenderer("conversation");
  forwardEventToRenderer("update-player-stats");
  forwardEventToRenderer("new-room");
  forwardEventToRenderer("update-online-users");
}

function forwardEventToRenderer(eventName) {
  eventBus.on(eventName, (data) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(eventName, data);
    }
  });
}

export const writeToTerminal = (data) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("terminal-write", data);
  }
};
